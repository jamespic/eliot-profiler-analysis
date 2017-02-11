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
            {'/static': ('eliot_profiler_analysis', 'static/bundle')}
        ),
        {
            '/api': api(db)
        }
    )

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument(
        'database', nargs='?',
        help='The directory in which to create or open the database. If not'
        ' supplied, a temporary database will be used'
    )
    args = parser.parse_args()

    eliot.add_destination(eliot.FileDestination(sys.stderr))
    dbdir = args.database or tempfile.mkdtemp()
    port = 8034
    try:
        with Database(dbdir) as db:
            httpd = Server(('0.0.0.0', port), app(db))
            print('Serving "{dbdir}" on {port}'.format(dbdir=dbdir, port=port))
            httpd.safe_start()
    finally:
        if not args.database:
            shutil.rmtree(dbdir)
