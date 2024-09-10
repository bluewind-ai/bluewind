# bluewind/test_runner.py

from django.test.runner import DiscoverRunner


class KeepDatabaseTestRunner(DiscoverRunner):
    # Skip database creation
    def setup_databases(self, **kwargs):
        print("KeepDatabaseTestRunner: Skipping database setup.")
        return None

    # Skip database teardown
    def teardown_databases(self, old_config, **kwargs):
        print("KeepDatabaseTestRunner: Skipping database teardown.")

    # Skip test environment setup to prevent flushing
    def setup_test_environment(self, **kwargs):
        print("KeepDatabaseTestRunner: Skipping test environment setup.")

    # Skip test environment teardown
    def teardown_test_environment(self, **kwargs):
        print("KeepDatabaseTestRunner: Skipping test environment teardown.")
