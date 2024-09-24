import gevent.monkey

gevent.monkey.patch_all()  # noqa
from bluewind.logging_config import get_logging_config  # noqa
from get_application import get_application

application = get_application()
