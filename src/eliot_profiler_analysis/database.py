import datetime
import lmdb
import json
import six
from wrapt import decorator
try:
    utc = datetime.timezone.utc
except:
    from pytz import utc


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
            now = datetime.datetime.now(utc).isoformat()
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
            value = txn.get(key, db=self._master_db)
            return json.loads(value.decode('utf-8'))

    @unyield
    def find(self, attrib_key, attrib_value):
        with self._env.begin() as txn:
            key = attrib_key.encode('utf-8') + b'~' + attrib_value.encode('utf-8')
            cursor = txn.cursor(db=self._attr_index_db)
            success = cursor.set_key(key)
            while success:
                yield cursor.value()
                success = cursor.next_dup()

    @unyield
    def attrib_names(self):
        with self._env.begin() as txn:
            cursor = txn.cursor(db=self._attr_value_db)
            success = cursor.first()
            while success:
                yield cursor.key().decode('utf-8')
                success = cursor.next_nodup()

    @unyield
    def attrib_values(self, attrib_key):
        with self._env.begin() as txn:
            cursor = txn.cursor(db=self._attr_value_db)
            success = cursor.set_key(attrib_key.encode('utf-8'))
            while success:
                yield cursor.value()
                success = cursor.next_dup()

    def close(self):
        self._env.close()
