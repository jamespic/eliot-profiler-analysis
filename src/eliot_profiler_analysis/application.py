from __future__ import absolute_import, print_function
from .wsgi_utils import route, static_content, totally_static_content
from os.path import join, dirname

app = route(
    static=static_content(join(dirname(__file__), 'static')),
    default=totally_static_content(join(dirname(__file__), 'static', 'index.html'))
)

if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    httpd = make_server('', 8034, app)
    print('Serving on 8034')
    httpd.serve_forever()
