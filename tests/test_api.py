from __future__ import absolute_import
import unittest
from eliot_profiler_analysis.api import api
from eliot_profiler_analysis.database import Database
import json
import shutil
import tempfile
from werkzeug.test import Client
from werkzeug.wrappers import Response


class TestSearch(unittest.TestCase):
    def assertMessage(self, **kwargs):
        self.logs.assertMessage(**kwargs)

    def setUp(self):
        if not hasattr(self, 'assertItemsEqual'):
            self.assertItemsEqual = self.assertCountEqual

        self.dbdir = tempfile.mkdtemp()
        self.db = Database(self.dbdir)
        self.data_item = {
            'task_uuid': '123',
            'source': 'test_source',
            'thread': 12345,
            'start_time': '2010-01-01T00:00:00.000+00:00',
        }
        (key,) = self.db.insert([self.data_item])
        self.key = key
        self.instance = Client(api(self.db), Response)

    def tearDown(self):
        self.db.close()
        shutil.rmtree(self.dbdir)

    def test_get_data_item(self):
        response = self.instance.get('/data/{key}'.format(key=self.key))
        self.assertEqual(self.data_item,
                         json.loads(response.data.decode('utf-8')))

    def test_search_data(self):
        response = self.instance.get('/data?source=test_source')
        self.assertEqual([[self.key, self.data_item]],
                         json.loads(response.data.decode('utf-8')))

    def test_post_data(self):
        test_item = {
            'task_uuid': '321',
            'source': 'test',
            'thread': 111,
            'start_time': '2012-01-01T00:00:00.000+00:00'
        }
        response = self.instance.post(
            '/data', data=json.dumps(test_item).encode('utf-8'))
        response_json = json.loads(response.data.decode('utf-8'))
        (key,) = response_json['keys']
        self.assertEqual(test_item, self.db.get(key))

    def test_attrib_names(self):
        response = self.instance.get('/attribs')
        self.assertItemsEqual(
            ['task_uuid', 'source', 'thread'],
            json.loads(response.data.decode('utf-8')))

    def test_attrib_names(self):
        response = self.instance.get('/attribs/thread')
        self.assertEqual(['12345'], json.loads(response.data.decode('utf-8')))
