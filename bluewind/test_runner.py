from django.test.runner import DiscoverRunner


class NoDbTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        pass

    def teardown_databases(self, old_config, **kwargs):
        pass
