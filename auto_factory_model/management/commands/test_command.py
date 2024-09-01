import os
from django.apps import apps


class AppDiscoverer:
    def __init__(self, root_dir):
        self.root_dir = root_dir
        self.discovered_apps = []
        self.excluded_dirs = {"django", "auth", "__pycache__", "migrations"}

    def discover(self):
        print(f"Starting app discovery in: {self.root_dir}")
        for item in os.listdir(self.root_dir):
            if self._should_inspect(item):
                full_path = os.path.join(self.root_dir, item)
                if self._is_django_app(full_path):
                    self.discovered_apps.append(item)
                    print(f"Discovered app: {item}")
        return self.discovered_apps

    def _should_inspect(self, item):
        return (
            os.path.isdir(os.path.join(self.root_dir, item))
            and not item.startswith(".")
            and item not in self.excluded_dirs
        )

    def _is_django_app(self, path):
        return os.path.exists(os.path.join(path, "apps.py")) or os.path.exists(
            os.path.join(path, "models.py")
        )

    def get_safe_apps(self):
        safe_apps = []
        existing_labels = set(app.label for app in apps.get_app_configs())
        for app in self.discovered_apps:
            try:
                app_config = apps.get_app_config(app)
                if app_config.label not in existing_labels:
                    safe_apps.append(app)
                    existing_labels.add(app_config.label)
                else:
                    print(f"Skipping {app} due to label conflict: {app_config.label}")
            except LookupError:
                safe_apps.append(app)
                print(f"Added {app} (no config found)")
        return safe_apps
