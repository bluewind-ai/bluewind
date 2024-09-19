import django.test
from django.test.runner import DiscoverRunner


class NoDbTestRunner(DiscoverRunner):
    """A test runner that does nothing with the database and checks for test case types."""

    def setup_databases(self, **kwargs):
        return None

    def teardown_databases(self, old_config, **kwargs):
        pass

    def setup_test_environment(self, **kwargs):
        self.check_test_cases()

    def teardown_test_environment(self, **kwargs):
        pass

    def check_test_cases(self):
        """
        Check if any test cases use django.test.TestCase or TransactionTestCase.
        Raise an error if found.
        """
        suite = self.build_suite(test_labels=None)  # This gets all the test cases
        for test in suite:
            if isinstance(
                test, (django.test.TestCase, django.test.TransactionTestCase)
            ):
                raise RuntimeError(
                    f"Error: Test '{test}' uses {type(test).__name__}. "
                    f"Please use unittest.TestCase instead otherwise you will the database will be wiped out."
                )
