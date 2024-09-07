import re
from logging import Filter


class SkipStaticFilter(Filter):
    """Logging filter to skip logging of staticfiles and favicon requests"""

    def filter(self, record):
        message = record.getMessage()
        return not (
            re.search(r"/static/", message) or re.search(r"/favicon.ico", message)
        )
