import json
from .wsgi_utils import returns_json, not_found
from werkzeug.wsgi import DispatcherMiddleware, make_line_iter
from wsgiref.util import shift_path_info


WSGI_INPUT = 'wsgi.input'
REQUEST_METHOD = 'REQUEST_METHOD'


def api(db):
    @returns_json
    def get(environ, start_response):
        key = shift_path_info(environ)
        data = db.get(key)
        print data
        if data is None:
            start_response('404 Not Found', [])
            return {'error': 'Not Found'}
        else:
            start_response('200 OK', [])
            return data

    @returns_json
    def insert(environ, start_response):
        instream = environ[WSGI_INPUT]
        content_length = environ.get('CONTENT_LENGTH')
        if content_length:
            instream = make_line_iter(instream, int(content_length))
        results = []
        for line in instream:
            # try:
                jsobj = json.loads(line.decode('utf-8'))
                key = db.insert(jsobj)
                results.append(key)
            # except:
            #     start_response('400 Bad Request', [])
            #     return {'message': 'Some data failed to insert', 'successes': results}
        start_response('200 OK', [])
        return {'message': 'Inserted OK', 'successes': results}

    def handle(environ, start_response):
        method = environ[REQUEST_METHOD]
        if method == 'GET':
            return get(environ, start_response)
        elif method == 'POST':
            return insert(environ, start_response)
        else:
            start_response('405 Method Not Allowed', [('Content-Type', 'text/plain')])
            return ['Method {} Not Allowed'.format(method).encode('ascii')]

    return handle
