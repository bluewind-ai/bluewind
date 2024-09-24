import gevent.monkey

gevent.monkey.patch_all()  # noqa
from get_application import get_application

application = get_application()
