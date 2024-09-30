class Debugger(Exception):
    _call_counts = {}

    def __init__(self, message, catch_nth_call):
        super().__init__(message)
        self.catch_nth_call = catch_nth_call
        self.key = (message, catch_nth_call)
        self._call_counts[self.key] = self._call_counts.get(self.key, 0) + 1

        if self._call_counts[self.key] == self.catch_nth_call:
            raise self
