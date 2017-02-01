import datetime
import json
import lmdb
import six
from contextlib import closing
from wrapt import decorator
from dateutil.parser import parse as parse_date
from pytz import utc

try:
    from itertools import izip
except ImportError:
    izip = zip

try:
    xrange
except NameError:
    xrange = range


def extract_attribs(item):
    if isinstance(item, dict):
        for key, value in six.iteritems(item):
            if key in ('children, message'):
                for extracted in extract_attribs(value):
                    yield extracted
            elif key != 'task_level' and not key.endswith('time'):
                for extracted in extract_attribs(value):
                    yield [key] + extracted
    elif isinstance(item, list):
        for list_item in item:
            for extracted in extract_attribs(list_item):
                yield extracted
    elif item is None:
        yield [u'null']
    else:
        yield [six.text_type(item)]


@decorator
def unyield(wrapped, instance, args, kwargs):
    return list(wrapped(*args, **kwargs))


NEWEST = 'newest'
OLDEST = 'oldest'


def _key_time(key):
    return parse_date(key.split(b'~')[0])


def _format_time(timestamp):
    return utc.normalize(timestamp).isoformat()


class Database(object):
    def __init__(self, db_file):
        self._env = lmdb.Environment(db_file, map_size=1024**4, max_dbs=3)
        with self._env.begin(write=True) as txn:
            self._master_db = self._env.open_db(b'master', txn=txn)
            self._attr_index_db = self._env.open_db(
                b'attr_index', txn=txn, dupsort=True)
            self._attr_value_db = self._env.open_db(
                b'attr_value', txn=txn, dupsort=True)

    def insert(self, item):
        with self._env.begin(write=True) as txn:
            now = datetime.datetime.now(utc).isoformat()  # FIXME Extract this from item
            item_key = u'{now}~{item[task_uuid]}~{item[source]}~{item[thread]}'.format(now=now, item=item).encode('ascii')
            txn.put(item_key, json.dumps(item).encode('utf-8'), db=self._master_db)
            for attrib in extract_attribs(item):
                attrib_key = u'.'.join(attrib[:-1]).encode('utf-8')
                attrib_val = attrib[-1].encode('utf-8')
                txn.put(attrib_key, attrib_val, db=self._attr_value_db)

                attrib_full = attrib_key + b'~' + attrib_val
                txn.put(attrib_full, item_key, db=self._attr_index_db)
            return item_key

    def get(self, key):
        with self._env.begin() as txn:
            return txn.get(key, db=self._master_db)

    @unyield
    def attrib_names(self):
        with self._env.begin() as txn:
            with txn.cursor(db=self._attr_value_db) as cursor:
                success = cursor.first()
                while success:
                    yield cursor.key().decode('utf-8')
                    success = cursor.next_nodup()

    @unyield
    def attrib_values(self, attrib_key):
        with self._env.begin() as txn:
            with txn.cursor(db=self._attr_value_db) as cursor:
                success = cursor.set_key(attrib_key.encode('utf-8'))
                while success:
                    yield cursor.value()
                    success = cursor.next_dup()

    @unyield
    def search(self, _start_time=None, _end_time=None, _count=None, _start_record=None, _order=NEWEST, **terms):
        if _order not in [NEWEST, OLDEST]:
            raise ValueError("_order must be 'newest' or 'oldest' - found {!r}".format(_order))
        with self._env.begin() as txn:
            def all_ascending():
                with txn.cursor(self._master_db) as cursor:
                    success = cursor.first()
                    while success:
                        yield cursor.item()
                        success = cursor.next()

            def all_ascending_start_time():
                with txn.cursor(self._master_db) as cursor:
                    success = cursor.set_range(_format_time(_start_time))
                    while success:
                        yield cursor.item()
                        success = cursor.next()

            def all_ascending_start_record():
                with txn.cursor(self._master_db) as cursor:
                    success = cursor.set_key(_start_record) and cursor.next()
                    while success:
                        yield cursor.item()
                        success = cursor.next()

            def all_descending():
                with txn.cursor(self._master_db) as cursor:
                    success = cursor.last()
                    while success:
                        yield cursor.item()
                        success = cursor.prev()

            def all_descending_end_time():
                with txn.cursor(self._master_db) as cursor:
                    success = cursor.prev() if cursor.set_range(_format_time(_end_time)) else cursor.last()
                    while success:
                        yield cursor.item()
                        success = cursor.prev()

            def all_descending_start_record():
                with txn.cursor(self._master_db) as cursor:
                    success = cursor.set_key(_start_record) and cursor.prev()
                    while success:
                        yield cursor.item()
                        success = cursor.prev()

            def indexed_ascending(index_entry):
                with txn.cursor(self._attr_index_db) as cursor:
                    success = cursor.set_key(index_entry)
                    while success:
                        yield cursor.value(), ()
                        success = cursor.next_dup()

            def indexed_ascending_start_time(index_entry):
                with txn.cursor(self._attr_index_db) as cursor:
                    success = cursor.set_range_dup(index_entry, _format_time(_start_time))
                    while success:
                        yield cursor.value(), ()
                        success = cursor.next_dup()

            def indexed_ascending_start_record(index_entry):
                with txn.cursor(self._attr_index_db) as cursor:
                    success = cursor.set_key_dup(index_entry, _start_record) and cursor.next_dup()
                    while success:
                        yield cursor.value(), ()
                        success = cursor.next_dup()

            def indexed_descending(index_entry):
                with txn.cursor(self._attr_index_db) as cursor:
                    success = cursor.set_key(index_entry) and cursor.last_dup()
                    while success:
                        yield cursor.value(), ()
                        success = cursor.prev_dup()

            def indexed_descending_end_time(index_entry):
                with txn.cursor(self._attr_index_db) as cursor:
                    success = cursor.prev_dup() if cursor.set_range_dup(index_entry, _format_time(_end_time)) else cursor.set_key(index_entry) and cursor.last_dup()
                    while success:
                        yield cursor.value(), ()
                        success = cursor.prev_dup()

            def indexed_descending_start_record(index_entry):
                with txn.cursor(self._attr_index_db) as cursor:
                    success = cursor.set_key_dup(index_entry, _start_record) and cursor.prev_dup()
                    while success:
                        yield cursor.value(), ()
                        success = cursor.prev_dup()

            def stop_time_ascending(stream):
                with closing(stream):
                    for key, value in stream:
                        if _key_time(key) >= _end_time:
                            break
                        else:
                            yield key, value

            def stop_time_descending(stream):
                with closing(stream):
                    for key, value in stream:
                        if _key_time(key) <= _start_time:
                            break
                        else:
                            yield key, value

            def filter_index(index_entry, stream):
                with closing(stream), txn.cursor(self._attr_index_db) as cursor:
                    for key, value in stream:
                        if cursor.set_key_dup(index_entry, key):
                            yield key, value

            def stop_count(stream):
                with closing(stream):
                    i = 0
                    while i < _count:
                        yield six.next(stream)
                        i += 1

            def materialize(stream):
                with closing(stream), txn.cursor(self._master_db) as cursor:
                    for key, _ in stream:
                        yield key, cursor.get(key)

            def get_cardinalities():
                with txn.cursor(self._attr_value_db) as cursor:
                    result = {}
                    success = cursor.first()
                    while success:
                        result[cursor.key()] = cursor.count()
                        success = cursor.next_nodup()
                    return result

            def get_index_key(attrib):
                return attrib.encode('utf-8') + b'~' + terms[attrib].encode('utf-8')

            if not terms:
                if _order == NEWEST:
                    if _start_record is not None:
                        stream = all_descending_start_record()
                    elif _end_time is not None:
                        stream = all_descending_end_time()
                    else:
                        stream = all_descending()
                else:
                    if _start_record is not None:
                        stream = all_ascending_start_record()
                    elif _start_time is not None:
                        stream = all_ascending_start_time()
                    else:
                        stream = all_ascending()
            else:
                cardinalities = get_cardinalities()
                try:
                    term_query_order = sorted(terms.keys(), key=cardinalities.__getitem__, reverse=True)
                except KeyError:
                    raise StopIteration
                index_entries = map(get_index_key, term_query_order)
                primary_index = index_entries[0]
                if _order == NEWEST:
                    if _start_record is not None:
                        stream = indexed_descending_start_record(primary_index)
                    elif _end_time is not None:
                        stream = indexed_descending_end_time(primary_index)
                    else:
                        stream = indexed_descending(primary_index)
                else:
                    if _start_record is not None:
                        stream = indexed_ascending_start_record(primary_index)
                    elif _start_time is not None:
                        stream = indexed_ascending_start_time(primary_index)
                    else:
                        stream = indexed_ascending(primary_index)

            if _order == NEWEST and _start_time is not None:
                stream = stop_time_descending(stream)
            elif _order == OLDEST and _end_time is not None:
                stream = stop_time_ascending(stream)

            if terms:
                for index_entry in index_entries[1:]:
                    stream = filter_index(index_entry, stream)
                stream = materialize(stream)

            if _count is not None:
                stream = stop_count(stream)

            # import pudb
            # pu.db
            for x in stream:
                yield x

    def close(self):
        self._env.close()

    def __enter__(self):
        return self

    def __exit__(self, value, type_, tb):
        self.close()
