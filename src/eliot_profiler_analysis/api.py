from cheroot.wsgi import PathInfoDispatcher
from dateutil.parser import parse as parse_date
import json
from pytz import utc
try:
    from urlparse import parse_qs
except ImportError:
    from urllib.parse import parse_qs
from .wsgi_utils import returns_json
from .aggregate import combine_call_graphs
from werkzeug.wsgi import make_line_iter, get_input_stream, responder, peek_path_info, pop_path_info, get_query_string
from werkzeug.wrappers import Response
import eliot


REQUEST_METHOD = 'REQUEST_METHOD'


def _make_search_date(datestr):
    date = parse_date(datestr)
    if date.tzinfo is None:
        date = date.replace(tzinfo=utc)
    return date


def _summarize_callgraph(callgraph, limit=5):
    class _FinishedSummarizing(Exception):
        pass

    actions = []
    instructions = []

    def read_node(node):
        if 'message' in node and 'action_type' in node['message']:
            action = node['message']['action_type']
            if action not in actions and len(actions) < limit:
                actions.append(action)
        if 'instruction' in node:
            instruction = node['instruction']
            if instruction not in instructions and len(instructions) < limit:
                instructions.append(instruction)
        if len(actions) >= limit and len(instructions) >= limit:
            raise _FinishedSummarizing()
        if 'children' in node:
            for child in node['children']:
                read_node(child)

    try:
        read_node(callgraph)
    except _FinishedSummarizing:
        pass

    return {
        'start_time': callgraph.get('start_time'),
        'time': callgraph.get('time'),
        'instructions': instructions,
        'actions': actions,
        'task_uuid': callgraph.get('task_uuid'),
        'source': callgraph.get('source')
    }


def api(db):
    @returns_json
    def get_data(environ, start_response):
        key = pop_path_info(environ)
        with eliot.start_action(action_type='api:get-data', key=key) as action:
            data = db.get(key)
            if data is None:
                action.add_success_fields(found=False)
                start_response('404 Not Found', [])
                return {'error': 'not_found', 'key': key}
            else:
                action.add_success_fields(found=True)
                return data

    @returns_json
    def insert_data(environ, start_response):
        with eliot.start_action(action_type='api:insert-data') as action:
            instream = make_line_iter(get_input_stream(environ))
            lines = (json.loads(line.decode('utf-8')) for line in instream)
            keys = db.insert(lines)
            action.add_success_fields(inserted_count=len(keys))
            return {'message': 'Inserted OK', 'keys': keys}

    @returns_json
    def search_data(environ, start_response):
        with eliot.start_action(action_type='api:search-data') as action:
            qs = parse_qs(get_query_string(environ))
            query = {key: value[0] for key, value in qs.items()}
            if '_start_time' in query:
                query['_start_time'] = _make_search_date(query['_start_time'])
            if '_end_time' in query:
                query['_end_time'] = _make_search_date(query['_end_time'])
            if '_count' in query:
                query['_count'] = int(query['_count'])
            if '_summary' in query:
                summarise = query['_summary'] == 'true'
                aggregate = query['_summary'] == 'aggregate'
                del query['_summary']
            else:
                summarise = False
                aggregate = False
            action.add_success_fields(query=query)
            query_result = db.search(**query)
            if summarise:
                result = [(key, _summarize_callgraph(cg))
                          for key, cg in query_result]
            elif aggregate:
                result = combine_call_graphs(cg for key, cg in query_result)
            else:
                result = list(query_result)
            action.add_success_fields(results=len(result))
            return result

    @responder
    def data(environ, start_response):
        method = environ[REQUEST_METHOD]
        if method == 'GET':
            if peek_path_info(environ):
                return get_data
            else:
                return search_data
        elif method == 'POST':
            return insert_data
        else:
            return Response('Method {} Not Allowed'.format(method), '405 Method Not Allowed')

    @returns_json
    def attrib_names(environ, start_response):
        with eliot.start_action(action_type='api:get-attrib-names') as action:
            return db.attrib_names()

    @returns_json
    def attrib_values(environ, start_response):
        key = pop_path_info(environ)
        with eliot.start_action(action_type='api:get-attrib-values', key=key) as action:
            return db.attrib_values(key)

    @responder
    def attribs(environ, start_response):
        method = environ[REQUEST_METHOD]
        if method == 'GET':
            if peek_path_info(environ):
                return attrib_values
            else:
                return attrib_names
        else:
            return Response('Method {} Not Allowed'.format(method), '405 Method Not Allowed')

    return PathInfoDispatcher({
        "/data": data,
        "/attribs": attribs
    })
