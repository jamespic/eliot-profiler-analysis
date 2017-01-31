from __future__ import absolute_import, print_function
from .wsgi_utils import not_found
from .api import api
from .database import Database
from werkzeug.wsgi import SharedDataMiddleware, DispatcherMiddleware
from werkzeug.serving import make_server
from os.path import join, dirname
import shutil
import tempfile


def app(db):
    return DispatcherMiddleware(
        SharedDataMiddleware(
            SharedDataMiddleware(
                not_found,
                {
                    '/': join(dirname(__file__), 'static', 'index.html')
                }
            ),
            {'/static': ('eliot_profiler_analysis', 'static')}
        ),
        {'/data': api(db)}
    )

if __name__ == '__main__':
    tmpdir = tempfile.mkdtemp()
    port = 8034
    try:
        with Database(tmpdir) as db:
            httpd = make_server('', port, app(db), threaded=True)
            print('Serving "{dbdir}" on {port}'.format(dbdir=tmpdir, port=port))
            httpd.serve_forever()
    finally:
        shutil.rmtree(tmpdir)
