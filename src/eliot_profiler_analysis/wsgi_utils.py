from wsgiref.util import shift_path_info, FileWrapper
from mimetypes import guess_type
from werkzeug.wrappers import Request, Response
from werkzeug.security import safe_join
import os
import json


PATH_INFO = 'PATH_INFO'
SCRIPT_NAME = 'SCRIPT_NAME'
FILE_WRAPPER = 'wsgi.file_wrapper'


@Request.application
def not_found(request):
    return Response("Address {request.path} nof found on this server".format(request=request), 404)


def route(**routes):
    def handler(environ, start_response):
        orig_path_info = environ[PATH_INFO]
        orig_script_name = environ[SCRIPT_NAME]
        path = shift_path_info(environ)
        handler = routes.get(path)

        if handler:
            return handler(environ, start_response)

        environ[PATH_INFO] = orig_path_info
        environ[SCRIPT_NAME] = orig_script_name

        if 'default' in routes:
            return routes['default'](environ, start_response)
        else:
            return not_found(environ, start_response)
    return handler


def returns_json(f):
    def handler(environ, start_response):
        def inner_start_response(status, headers):
            inner_start_response.status = status
            inner_start_response.headers = headers
        result = f(environ, inner_start_response)
        output = [json.dumps(result).encode('utf-8')]
        start_response(inner_start_response.status,
                       inner_start_response.headers
                       + [('Content-Type', 'application/json')])
        return output
    return handler
