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
            {'/static': ('profilomatic_analysis', 'static/bundle')}
        ),
        {
            '/api': api(db)
        }
    )


def debug_wrapper(app):
    def handler(environ, start_response):
        try:
            return app(environ, start_response)
        except:
            import pudb
            pudb.post_mortem()
            raise
    return handler


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument(
        'database', nargs='?',
        help='The directory in which to create or open the database. If not'
        ' supplied, a temporary database will be used'
    )
    parser.add_argument(
        '--debug', action='store_true',
        help='Enable pudb post mortem debugging'
    )
    args = parser.parse_args()

    eliot.add_destination(eliot.FileDestination(sys.stderr))
    dbdir = args.database or tempfile.mkdtemp()
    port = 8034
    try:
        with Database(dbdir) as db:
            the_app = app(db)
            if args.debug:
                the_app = debug_wrapper(the_app)
            httpd = Server(('0.0.0.0', port), the_app)
            print('Serving "{dbdir}" on {port}'.format(dbdir=dbdir, port=port))
            httpd.safe_start()
    finally:
        if not args.database:
            shutil.rmtree(dbdir)
