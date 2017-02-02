from __future__ import print_function
import unittest
import sys
from werkzeug.test import Client
from werkzeug.wrappers import Response
from eliot_profiler_analysis.wsgi_utils import not_found, returns_json


class NotFoundTest(unittest.TestCase):
    def test_not_found(self):
        client = Client(not_found, Response)
        response = client.get('/hello')
        self.assertEqual(404, response.status_code)
        self.assertIn(b'/hello', response.data)


class ReturnsJsonTest(unittest.TestCase):
    def test_success_skipped_start_response(self):
        @returns_json
        def app(environ, start_response):
            return {'success': True}
        client = Client(app, Response)
        response = client.get('/')
        self.assertEqual(200, response.status_code)
        self.assertEqual(b'{"success": true}', response.data)

    def test_success(self):
        @returns_json
        def app(environ, start_response):
            start_response('404 Not Found', [('X-Hello', 'World')])
            return {'found': False}
        client = Client(app, Response)
        response = client.get('/')
        self.assertEqual(404, response.status_code)
        self.assertEqual(b'{"found": false}', response.data)
        self.assertEqual('World', response.headers['X-Hello'])

    def test_failure(self):
        @returns_json
        def app(environ, start_response):
            start_response('200 OK', [])
            try:
                raise ZeroDivisionError()
            except:
                start_response('503 Service Unavailable', [], sys.exc_info())
        client = Client(app, Response)
        with self.assertRaises(ZeroDivisionError):
            response = client.get('/')
