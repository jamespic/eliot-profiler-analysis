import json
import traceback
from .wsgi_utils import returns_json, not_found
from werkzeug.wsgi import DispatcherMiddleware, make_line_iter, get_input_stream, responder
from werkzeug.wrappers import Request, Response
from wsgiref.util import shift_path_info


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
        instream = make_line_iter(get_input_stream(environ))
        results = []
        for line in instream:
            try:
                jsobj = json.loads(line.decode('utf-8'))
                key = db.insert(jsobj)
                results.append(key)
            except:
                traceback.print_exc()  # Replace this with eliot
                start_response('400 Bad Request', [])
                return {'message': 'Some data failed to insert', 'successes': results}
        start_response('200 OK', [])
        return {'message': 'Inserted OK', 'successes': results}

    @responder
    def handle(environ, start_response):
        method = environ[REQUEST_METHOD]
        if method == 'GET':
            return get
        elif method == 'POST':
            return insert
        else:
            return Response('Method {} Not Allowed'.format(method), '405 Method Not Allowed')


    return handle
