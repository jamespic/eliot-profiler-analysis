#!/usr/bin/env python


from setuptools import setup, find_packages


setup(
    name='Eliot Profiler Analysis',
    version='0.1',
    description='An analysis tool for Eliot Profiler data',
    author='James Pickering',
    author_email='james_pic@hotmail.com',
    url='https://github.com/jamespic/eliot-profiler',
    packages=find_packages('src'),
    package_dir={'':'src'},
    include_package_data=True,
    install_requires=[
        'eliot',
        'werkzeug',
        'lmdb',
        'six',
        'wrapt',
        'pytz',
        'cheroot>=5.1.0'
    ],
    test_suite='tests'
)
