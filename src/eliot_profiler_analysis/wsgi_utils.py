from werkzeug.wrappers import Request, Response
import json


PATH_INFO = 'PATH_INFO'
SCRIPT_NAME = 'SCRIPT_NAME'
FILE_WRAPPER = 'wsgi.file_wrapper'


@Request.application
def not_found(request):
    return Response("Address {request.path} nof found on this server".format(request=request), 404)


def returns_json(f):
    def handler(environ, start_response):
        def inner_start_response(status, headers, exc_info=None):
            inner_start_response.started = True
            return start_response(
                status, headers + [('Content-Type', 'application/json')], exc_info)
        inner_start_response.started = False
        result = f(environ, inner_start_response)
        output = [json.dumps(result).encode('utf-8')]
        if not inner_start_response.started:
            start_response('200 OK', [('Content-Type', 'application/json')])
        return output
    return handler
