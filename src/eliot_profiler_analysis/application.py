from __future__ import absolute_import, print_function
from .wsgi_utils import not_found
from .api import api
from .database import Database
import eliot
from werkzeug.wsgi import SharedDataMiddleware, DispatcherMiddleware
from cheroot.wsgi import Server
from os.path import join, dirname
import shutil
import tempfile
import sys


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
        {
            '/api': api(db)
        }
    )

if __name__ == '__main__':
    eliot.add_destination(eliot.FileDestination(sys.stderr))
    tmpdir = tempfile.mkdtemp()
    port = 8034
    try:
        with Database(tmpdir) as db:
            httpd = Server(('0.0.0.0', port), app(db))
            print('Serving "{dbdir}" on {port}'.format(dbdir=tmpdir, port=port))
            httpd.safe_start()
    finally:
        shutil.rmtree(tmpdir)
