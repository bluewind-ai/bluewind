import gevent.monkey

gevent.monkey.patch_all()  # noqa
import builtins

from bluewind.custom_exception import debugger  # noqa
from get_application import get_application

builtins.debugger = debugger

application = get_application()
