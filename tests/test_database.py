from __future__ import absolute_import
import tempfile
import unittest
import shutil
import datetime
from profilomatic_analysis.database import Database, extract_attribs, OLDEST
from pytz import utc
from .util import TestLogDestination


def dt(*args, **kwargs):
    return utc.localize(datetime.datetime(*args, **kwargs))


class DatabaseTest(unittest.TestCase):
    def setUp(self):
        if not hasattr(self, 'assertItemsEqual'):
            self.assertItemsEqual = self.assertCountEqual
        self.dbdir = tempfile.mkdtemp()
        self.instance = Database(self.dbdir)

    def tearDown(self):
        self.instance.close()
        shutil.rmtree(self.dbdir)

    def test_extract_attribs(self):
        attribs = extract_attribs({
            'start_time': '2010-01-01',
            'extra_info': {
                'field': 1,
                'l': [1, 2],
                'x': [{'y': 2}],
                'timestamp': 12345.0
            },
            'task_level': [1, 2, 3],
            'children': [
                {
                    'message': {'hello': 'world'}
                },
                {
                    'message': 'hello'
                }
            ]
        })
        self.assertItemsEqual([
            ('extra_info.field', '1'),
            ('extra_info.l', '1'),
            ('extra_info.l', '2'),
            ('extra_info.x.y', '2'),
            ('hello', 'world'),
            ('message', 'hello')  # Special case - use message if no other key
        ], attribs)

    def test_basic_functions(self):
        data_item_1 = {
            'task_uuid': '123',
            'source': 'test_source',
            'thread': 12345,
            'start_time': '1963-01-01T16:50:00.000-05:00',
            'extra_field': 666
        }
        data_item_2 = {
            'task_uuid': '124',
            'source': 'test_source',
            'thread': 12346,
            'start_time': '1963-01-01T16:51:00.000-05:00',
            'another_field': True,
            'further_field': None
        }
        result1, result2 = self.instance.insert([data_item_1, data_item_2])
        self.assertEqual(data_item_1, self.instance.get(result1))
        self.assertEqual(data_item_2, self.instance.get(result2))
        self.assertIsNone(self.instance.get('badkey'))
        self.assertItemsEqual([
            'task_uuid', 'source', 'thread', 'extra_field', 'another_field',
            'further_field'
        ], self.instance.attrib_names())
        self.assertItemsEqual(['123', '124'],
                              self.instance.attrib_values('task_uuid'))
        self.assertItemsEqual(['test_source'],
                              self.instance.attrib_values('source'))
        self.assertItemsEqual(['666'],
                              self.instance.attrib_values('extra_field'))
        self.assertItemsEqual(['true'],
                              self.instance.attrib_values('another_field'))
        self.assertItemsEqual(['null'],
                              self.instance.attrib_values('further_field'))

    def test_insert_empty_value(self):
        data_item_1 = {
            'task_uuid': '123',
            'source': 'test_source',
            'thread': 54321,
            'start_time': '2010-01-01T09:00:00.000+00:00',
            'message': {
                'action_type': 'hello'
            }
        }
        data_item_2 = {
            'task_uuid': '123',
            'source': 'test_source',
            'thread': 54321,
            'start_time': '2010-01-01T09:00:00.000+00:00',
            'message': {
                'action_type': ''
            }
        }
        self.instance.insert([data_item_1, data_item_2])
        self.assertEqual(['<empty>', 'hello'], self.instance.attrib_values('action_type'))


class TestSearch(unittest.TestCase):
    def assertMessage(self, **kwargs):
        self.logs.assertMessage(**kwargs)

    def run(self, result=None):
        dbdir = tempfile.mkdtemp()
        try:
            with TestLogDestination() as logs, Database(dbdir) as instance:
                self.logs = logs
                self.instance = instance

                data_item_1 = {
                    'task_uuid': '123',
                    'source': 'test_source',
                    'thread': 12345,
                    'start_time': '2010-01-01T00:00:00.000+00:00',
                    'extra_field': 666
                }
                data_item_2 = {
                    'task_uuid': '124',
                    'source': 'test_source',
                    'thread': 12346,
                    'start_time': '2010-01-03T00:00:00.000+00:00',
                    'another_field': True,
                    'further_field': None
                }
                data_item_3 = {
                    'task_uuid': '125',
                    'source': 'test_source',
                    'thread': 12346,
                    'start_time': '2010-01-05T00:00:00.000+00:00',
                }
                result1, result2, result3 = self.instance.insert([data_item_1, data_item_2, data_item_3])
                self.r1 = result1
                self.r2 = result2
                self.r3 = result3
                self.o1 = (result1, data_item_1)
                self.o2 = (result2, data_item_2)
                self.o3 = (result3, data_item_3)
                super(TestSearch, self).run(result)
        finally:
            shutil.rmtree(dbdir)

    def test_all_descending(self):
        result = list(self.instance.search())
        self.assertEqual([self.o3, self.o2, self.o1], result)
        self.assertMessage(query_plan=['all_descending'])

    def test_all_descending_start_record(self):
        result = list(self.instance.search(_start_record=self.r3))
        self.assertEqual([self.o2, self.o1], result)
        self.assertMessage(query_plan=['all_descending_start_record'])

    def test_all_descending_end_time(self):
        result = list(self.instance.search(_end_time=dt(2010, 1, 4)))
        self.assertEqual([self.o2, self.o1], result)
        self.assertMessage(query_plan=['all_descending_end_time'])

    def test_all_descending_start_time(self):
        result = list(self.instance.search(_start_time=dt(2010, 1, 2)))
        self.assertEqual([self.o3, self.o2], result)
        self.assertMessage(query_plan=['all_descending', 'stop_time_descending'])

    def test_all_descending_stop_count(self):
        result = list(self.instance.search(_order=OLDEST, _count=2))
        self.assertEqual([self.o1, self.o2], result)
        self.assertMessage(query_plan=['all_ascending', 'stop_count'])

    def test_all_ascending_start_record(self):
        result = list(self.instance.search(_order=OLDEST, _start_record=self.r1))
        self.assertEqual([self.o2, self.o3], result)
        self.assertMessage(query_plan=['all_ascending_start_record'])

    def test_all_ascending_start_time(self):
        result = list(self.instance.search(_order=OLDEST,
                                      _start_time=dt(2010, 1, 2)))
        self.assertEqual([self.o2, self.o3], result)
        self.assertMessage(query_plan=['all_ascending_start_time'])

    def test_all_ascending_end_time(self):
        result = list(self.instance.search(_order=OLDEST, _end_time=dt(2010, 1, 4)))
        self.assertEqual([self.o1, self.o2], result)
        self.assertMessage(query_plan=['all_ascending', 'stop_time_ascending'])

    def test_indexed_descending(self):
        result = list(self.instance.search(thread='12346'))
        self.assertEqual([self.o3, self.o2], result)
        self.assertMessage(query_plan=[
            ('indexed_descending', 'thread=12346'),
            'materialize'
        ])

    def test_indexed_descending_start_record(self):
        result = list(self.instance.search(
            source='test_source', _start_record=self.r3))
        self.assertEqual([self.o2, self.o1], result)
        self.assertMessage(query_plan=[
            ('indexed_descending_start_record', 'source=test_source'),
            'materialize'
        ])

    def test_indexed_descending_end_time(self):
        result = list(self.instance.search(
            source='test_source', _end_time=dt(2010, 1, 4)))
        self.assertEqual([self.o2, self.o1], result)
        self.assertMessage(query_plan=[
            ('indexed_descending_end_time', 'source=test_source'),
            'materialize'
        ])

    def test_indexed_ascending(self):
        result = list(self.instance.search(_order=OLDEST, thread='12346'))
        self.assertEqual([self.o2, self.o3], result)
        self.assertMessage(query_plan=[
            ('indexed_ascending', 'thread=12346'),
            'materialize'
        ])

    def test_indexed_ascending_start_record(self):
        result = list(self.instance.search(
            _order=OLDEST, _start_record=self.r1, source='test_source'))
        self.assertEqual([self.o2, self.o3], result)
        self.assertMessage(query_plan=[
            ('indexed_ascending_start_record', 'source=test_source'),
            'materialize'
        ])

    def test_indexed_ascending_start_time(self):
        result = list(self.instance.search(
            _order=OLDEST, _start_time=dt(2010, 1, 2), source='test_source'))
        self.assertEqual([self.o2, self.o3], result)
        self.assertMessage(query_plan=[
            ('indexed_ascending_start_time', 'source=test_source'),
            'materialize'
        ])

    def test_index_order(self):
        result = list(self.instance.search(
            task_uuid='124', source='test_source', thread='12346'))
        self.assertEqual([self.o2], result)
        self.assertMessage(query_plan=[
            ('indexed_descending', 'task_uuid=124'),
            ('filter_index', 'thread=12346'),
            ('filter_index', 'source=test_source'),
            'materialize'
        ])
