import gevent.monkey

gevent.monkey.patch_all()  # noqa
import builtins

from bluewind.custom_exception import raise_debug  # noqa
from get_application import get_application

builtins.raise_debug = raise_debug

application = get_application()
