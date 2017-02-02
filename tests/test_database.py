import tempfile
import unittest
import shutil
from eliot_profiler_analysis.database import Database, extract_attribs


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
