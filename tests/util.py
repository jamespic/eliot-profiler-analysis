import eliot
from pprint import pprint


def match_object(target, pattern):
    if isinstance(pattern, dict):
        return all(key in target and match_object(target[key], value)
                   for key, value in pattern.items())
    if isinstance(pattern, list):
        return (len(target) == len(pattern)
                and all(match_object(t, p) for t, p in zip(target, pattern)))
    else:
        return pattern == target


class TestLogDestination(object):
    def __init__(self):
        self.messages = []

    def __call__(self, message):
        self.messages.append(message)

    def __enter__(self):
        eliot.add_destination(self)
        return self

    def __exit__(self, typ_, exc, tb):
        if exc:
            pprint(self.messages)
        eliot.remove_destination(self)

    def assertMessage(self, **kwargs):
        try:
            assert any(match_object(m, kwargs) for m in self.messages)
        except:
            print('{kwargs} not found among messages: {self.messages}'
                  .format(**locals()))
            raise
