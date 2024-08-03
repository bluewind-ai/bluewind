import sys
from types import ModuleType

from django.conf import (
    DEFAULT_FILE_STORAGE_DEPRECATED_MSG,
    DEFAULT_STORAGE_ALIAS,
    STATICFILES_STORAGE_ALIAS,
    STATICFILES_STORAGE_DEPRECATED_MSG,
    Settings,
    settings,
)
from django.contrib.staticfiles.storage import (
    ManifestStaticFilesStorage,
    staticfiles_storage,
)
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import Storage, StorageHandler, default_storage, storages
from django.test import TestCase, ignore_warnings
from django.utils.deprecation import RemovedInDjango51Warning


class StaticfilesStorageDeprecationTests(TestCase):
    msg = STATICFILES_STORAGE_DEPRECATED_MSG

    def test_override_settings_warning(self):
        with self.assertRaisesMessage(RemovedInDjango51Warning, self.msg):
            with self.settings(
                STATICFILES_STORAGE=(
                    "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
                )
            ):
                pass

    def test_settings_init(self):
        old_staticfiles_storage = settings.STORAGES.get(STATICFILES_STORAGE_ALIAS)
        settings_module = ModuleType("fake_settings_module")
        settings_module.USE_TZ = True
        settings_module.STATICFILES_STORAGE = (
            "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
        )
        sys.modules["fake_settings_module"] = settings_module
        try:
            with self.assertWarnsMessage(RemovedInDjango51Warning, self.msg):
                fake_settings = Settings("fake_settings_module")
            self.assertEqual(
                fake_settings.STORAGES[STATICFILES_STORAGE_ALIAS],
                {
                    "BACKEND": (
                        "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
                    ),
                },
            )
            # settings.STORAGES is not mutated.
            self.assertEqual(
                settings.STORAGES.get(STATICFILES_STORAGE_ALIAS),
                old_staticfiles_storage,
            )
        finally:
            del sys.modules["fake_settings_module"]

    def test_settings_storages_init(self):
        settings_module = ModuleType("fake_settings_module")
        settings_module.USE_TZ = True
        settings_module.STORAGES = {
            STATICFILES_STORAGE_ALIAS: {
                "BACKEND": (
                    "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
                )
            }
        }
        sys.modules["fake_settings_module"] = settings_module
        try:
            fake_settings = Settings("fake_settings_module")
            self.assertEqual(
                fake_settings.STATICFILES_STORAGE,
                "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
            )
        finally:
            del sys.modules["fake_settings_module"]

    def test_access_warning(self):
        with self.assertRaisesMessage(RemovedInDjango51Warning, self.msg):
            settings.STATICFILES_STORAGE
        # Works a second time.
        with self.assertRaisesMessage(RemovedInDjango51Warning, self.msg):
            settings.STATICFILES_STORAGE

    @ignore_warnings(category=RemovedInDjango51Warning)
    def test_access(self):
        with self.settings(
            STATICFILES_STORAGE=(
                "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
            )
        ):
            self.assertEqual(
                settings.STATICFILES_STORAGE,
                "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
            )
            # Works a second time.
            self.assertEqual(
                settings.STATICFILES_STORAGE,
                "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
            )

    def test_use_both_error(self):
        msg = "STATICFILES_STORAGE/STORAGES are mutually exclusive."
        settings_module = ModuleType("fake_settings_module")
        settings_module.USE_TZ = True
        settings_module.STATICFILES_STORAGE = (
            "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
        )
        settings_module.STORAGES = {}
        sys.modules["fake_settings_module"] = settings_module
        try:
            with self.assertRaisesMessage(ImproperlyConfigured, msg):
                Settings("fake_settings_module")
        finally:
            del sys.modules["fake_settings_module"]

    @ignore_warnings(category=RemovedInDjango51Warning)
    def test_storage(self):
        empty_storages = StorageHandler()
        with self.settings(
            STATICFILES_STORAGE=(
                "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
            )
        ):
            self.assertIsInstance(
                storages[STATICFILES_STORAGE_ALIAS],
                ManifestStaticFilesStorage,
            )
            self.assertIsInstance(
                empty_storages[STATICFILES_STORAGE_ALIAS],
                ManifestStaticFilesStorage,
            )
            self.assertIsInstance(staticfiles_storage, ManifestStaticFilesStorage)

    @ignore_warnings(category=RemovedInDjango51Warning)
    def test_staticfiles_storage(self):
        with self.settings(
            STORAGES={
                STATICFILES_STORAGE_ALIAS: {
                    "BACKEND": (
                        "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
                    )
                }
            }
        ):
            self.assertEqual(
                settings.STATICFILES_STORAGE,
                "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
            )
            self.assertIsInstance(
                storages[STATICFILES_STORAGE_ALIAS],
                ManifestStaticFilesStorage,
            )


class DefaultStorageDeprecationTests(TestCase):
    msg = DEFAULT_FILE_STORAGE_DEPRECATED_MSG

    def test_override_settings_warning(self):
        with self.assertRaisesMessage(RemovedInDjango51Warning, self.msg):
            with self.settings(
                DEFAULT_FILE_STORAGE=("django.core.files.storage.Storage")
            ):
                pass

    def test_settings_init(self):
        old_default_storage = settings.STORAGES.get(DEFAULT_STORAGE_ALIAS)
        settings_module = ModuleType("fake_settings_module")
        settings_module.USE_TZ = True
        settings_module.DEFAULT_FILE_STORAGE = "django.core.files.storage.Storage"
        sys.modules["fake_settings_module"] = settings_module
        try:
            with self.assertWarnsMessage(RemovedInDjango51Warning, self.msg):
                fake_settings = Settings("fake_settings_module")
            self.assertEqual(
                fake_settings.STORAGES[DEFAULT_STORAGE_ALIAS],
                {"BACKEND": "django.core.files.storage.Storage"},
            )
            # settings.STORAGES is not mutated.
            self.assertEqual(
                settings.STORAGES.get(DEFAULT_STORAGE_ALIAS),
                old_default_storage,
            )
        finally:
            del sys.modules["fake_settings_module"]

    def test_settings_storages_init(self):
        settings_module = ModuleType("fake_settings_module")
        settings_module.USE_TZ = True
        settings_module.STORAGES = {
            DEFAULT_STORAGE_ALIAS: {
                "BACKEND": "django.core.files.storage.Storage",
            }
        }
        sys.modules["fake_settings_module"] = settings_module
        try:
            fake_settings = Settings("fake_settings_module")
            self.assertEqual(
                fake_settings.DEFAULT_FILE_STORAGE,
                "django.core.files.storage.Storage",
            )
        finally:
            del sys.modules["fake_settings_module"]

    def test_access_warning(self):
        with self.assertRaisesMessage(RemovedInDjango51Warning, self.msg):
            settings.DEFAULT_FILE_STORAGE
        # Works a second time.
        with self.assertRaisesMessage(RemovedInDjango51Warning, self.msg):
            settings.DEFAULT_FILE_STORAGE

    @ignore_warnings(category=RemovedInDjango51Warning)
    def test_access(self):
        with self.settings(DEFAULT_FILE_STORAGE="django.core.files.storage.Storage"):
            self.assertEqual(
                settings.DEFAULT_FILE_STORAGE,
                "django.core.files.storage.Storage",
            )
            # Works a second time.
            self.assertEqual(
                settings.DEFAULT_FILE_STORAGE,
                "django.core.files.storage.Storage",
            )

    def test_use_both_error(self):
        msg = "DEFAULT_FILE_STORAGE/STORAGES are mutually exclusive."
        settings_module = ModuleType("fake_settings_module")
        settings_module.USE_TZ = True
        settings_module.DEFAULT_FILE_STORAGE = "django.core.files.storage.Storage"
        settings_module.STORAGES = {}
        sys.modules["fake_settings_module"] = settings_module
        try:
            with self.assertRaisesMessage(ImproperlyConfigured, msg):
                Settings("fake_settings_module")
        finally:
            del sys.modules["fake_settings_module"]

    @ignore_warnings(category=RemovedInDjango51Warning)
    def test_storage(self):
        empty_storages = StorageHandler()
        with self.settings(DEFAULT_FILE_STORAGE="django.core.files.storage.Storage"):
            self.assertIsInstance(storages[DEFAULT_STORAGE_ALIAS], Storage)
            self.assertIsInstance(empty_storages[DEFAULT_STORAGE_ALIAS], Storage)
            self.assertIsInstance(default_storage, Storage)

    @ignore_warnings(category=RemovedInDjango51Warning)
    def test_default_file_storage(self):
        with self.settings(
            STORAGES={
                DEFAULT_STORAGE_ALIAS: {
                    "BACKEND": "django.core.files.storage.Storage",
                }
            }
        ):
            self.assertEqual(
                settings.DEFAULT_FILE_STORAGE,
                "django.core.files.storage.Storage",
            )
            self.assertIsInstance(storages[DEFAULT_STORAGE_ALIAS], Storage)
