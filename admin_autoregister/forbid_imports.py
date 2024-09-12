from importlib.abc import Loader, MetaPathFinder
from importlib.util import spec_from_loader


class ForbiddenImportError(ImportError):
    pass


class ForbiddenImportFinder(MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        if fullname == "django.contrib.auth.models":
            return spec_from_loader(fullname, ForbiddenImportLoader())
        return None


class ForbiddenImportLoader(Loader):
    def create_module(self, spec):
        raise ForbiddenImportError(
            "Importing User from django.contrib.auth.models is not allowed"
        )

    def exec_module(self, module):
        pass
