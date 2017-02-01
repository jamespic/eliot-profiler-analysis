from dateutil.parser import parse as parse_date
import json
from pytz import utc
import traceback
from urlparse import parse_qs
from .wsgi_utils import returns_json, not_found
from werkzeug.wsgi import DispatcherMiddleware, make_line_iter, get_input_stream, responder, peek_path_info, pop_path_info, get_query_string
from werkzeug.wrappers import Request, Response


REQUEST_METHOD = 'REQUEST_METHOD'


def _make_search_date(datestr):
    date = parse_date(datestr)
    if date.tzinfo is None:
        date = date.replace(tzinfo=utc)
    return date


def api(db):
    def get(environ, start_response):
        key = pop_path_info(environ)
        data = db.get(key)
        if data is None:
            return not_found(environ, start_response)
        else:
            start_response('200 OK', [('Content-Type', 'application/json')])
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

    @returns_json
    def search(environ, start_response):
        qs = parse_qs(get_query_string(environ))
        query = {key: value[0] for key, value in qs.items()}
        if '_start_time' in query:
            query['_start_time'] = _make_search_date(query['_start_time'])
        if '_end_time' in query:
            query['_end_time'] = _make_search_date(query['_end_time'])
        if '_count' in query:
            query['_count'] = _make_search_date(query['_count'])
        result = db.search(**query)
        start_response('200 OK', [])
        return result

    @responder
    def handle(environ, start_response):
        method = environ[REQUEST_METHOD]
        if method == 'GET':
            if peek_path_info(environ):
                return get
            else:
                return search
        elif method == 'POST':
            return insert
        else:
            return Response('Method {} Not Allowed'.format(method), '405 Method Not Allowed')


    return handle
