#!/usr/bin/env python
from subprocess import check_call
from setuptools import setup, find_packages
from setuptools.command.sdist import sdist as _sdist


class sdist(_sdist):
    def run(self):
        check_call(['webpack'])
        _sdist.run(self)

setup(
    name='Profil-o-matic-analysis',
    version='0.2.0',
    description='An analysis tool for Profil-o-matic data',
    author='James Pickering',
    author_email='james_pic@hotmail.com',
    url='https://github.com/jamespic/profil-o-matic-analysis',
    packages=find_packages('src'),
    package_dir={'':'src'},
    include_package_data=True,
    install_requires=[
        'ciso8601',
        'eliot',
        'werkzeug',
        'lmdb',
        'six',
        'wrapt',
        'pytz',
        'cheroot>=5.1.0'
    ],
    test_suite='tests',
    cmdclass={'sdist': sdist}
)
