from __future__ import absolute_import, print_function
import os
import shutil
import sys
import tempfile

from os.path import join, dirname

import eliot

from werkzeug.wsgi import SharedDataMiddleware, DispatcherMiddleware
from cheroot.wsgi import Server

from .wsgi_utils import not_found
from .api import api
from .database import Database


_DB_DIR_ENV_VAR = 'PROFILOMATIC_DB_DIR'


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
    parser.add_argument(
        '--port', type=int, default=8034,
        help='Port to listen for connections on')
    parser.add_argument(
        '--host', default='0.0.0.0',
        help='Host to bind to')
    args = parser.parse_args()

    eliot.add_destination(eliot.FileDestination(sys.stderr))
    dbdir = args.database or tempfile.mkdtemp()
    try:
        with Database(dbdir) as db:
            the_app = app(db)
            if args.debug:
                the_app = debug_wrapper(the_app)
            httpd = Server((args.host, args.port), the_app)
            print('Serving "{dbdir}" on {args.host}:{args.port}'
                  .format(dbdir=dbdir, args=args))
            httpd.safe_start()
    finally:
        if not args.database:
            shutil.rmtree(dbdir)

elif os.getenv(_DB_DIR_ENV_VAR):
    # To run from within a WSGI container like uWSGI, must configure DB dir via
    # env var PROFILOMATIC_DB_DIR
    eliot.add_destination(eliot.FileDestination(sys.stderr))
    db = Database(os.getenv(_DB_DIR_ENV_VAR))
    the_app = app(db)
