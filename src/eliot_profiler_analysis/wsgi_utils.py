from wsgiref.util import shift_path_info, FileWrapper
from mimetypes import guess_type
from werkzeug.wrappers import Request, Response
from werkzeug.security import safe_join
import os


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


def static_content(path):
    def handler(environ, start_response):
        try:
            resource_path = safe_join(path, environ[PATH_INFO].lstrip('/'))
            return totally_static_content(resource_path)(environ, start_response)
        except:
            return not_found(environ, start_response)
    return handler


def totally_static_content(path):
    def handler(environ, start_response):
        mimetype, encoding = guess_type(path, strict=False)
        f = open(path, 'rb')
        headers = [
            ('Content-Type', mimetype),
            ('Content-Length', bytes(os.fstat(f.fileno()).st_size))
        ]
        if encoding:
            headers.append(('Content-Encoding', encoding))
        start_response('200 OK', headers)
        wrapper = environ.get(FILE_WRAPPER, FileWrapper)
        return wrapper(f)
    return handler
