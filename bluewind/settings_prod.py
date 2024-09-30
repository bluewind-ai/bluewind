import json
import os
import warnings
from pathlib import Path

import colored_traceback
import colored_traceback.always

colored_traceback.add_hook()
import environ

BASE_DIR = Path(__file__).resolve().parent.parent
os.environ["BASE_DIR"] = str(BASE_DIR)


# Define a custom traceback formatter

from bluewind.logging_config import get_logging_config  # noqa

LOGGING = get_logging_config()


# Base Directory

LOG_FILE_PATH = os.path.join(BASE_DIR, "logs", "app.log")

# Core Django Settings
SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = os.environ["DEBUG"]
ALLOWED_HOSTS = environ.Env().list("ALLOWED_HOSTS")
ROOT_URLCONF = "bluewind.urls"
WSGI_APPLICATION = "bluewind.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
ASGI_APPLICATION = "bluewind.asgi.application"


# Application Definition
INSTALLED_APPS = [
    # Django core apps
    "unfold",
    "unfold.contrib.import_export",
    "unfold.contrib.inlines",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "django.db.migrations",
    "bluewind",
    "users",
    "workspace_users",
    "workspaces",
    "functions",
    "function_calls",
    "files",
    "admin_autoregister",
    "debug_toolbar",
    "django_json_widget",
    "import_export",
    "domain_names",
    "forms",
    "form_data",
    "function_call_dependencies",
    "function_variables",
    "models",
    "test_inlines",
    # # "behave_django",
    # "channels",
    # "model_clone",
    # "slippers",
    # "widget_tweaks",
    # "base_model_admin",
    # "auto_tests",
    # "people",
    # "chat_messages",
    # "db_graph",
    # "apollo_people_search",
    # "gmail_subscriptions",
    # "base_model.apps.BaseModelConfig",
    # "gmail_events",
    # "credentials",
    # "base64_utils",
    # # This should be last
    # "channel_wizzard",
    # "draft_messages",
    # "flows",
    # "entity",
    # "workspace_snapshots",
    # "rest_framework",
    # "drf_spectacular",
    # "drf_standardized_errors",
    # "incoming_http_requests",
    # "app_logs",
    # "flow_runs",
    # "action_runs",
    # "step_runs",
    # "steps",
    # "actions",
    # "recordings",
    # "file_watchers",
    # "file_system_changes",
    # "flow_parameters",
    # "apps",
    # "workspace_diffs",
    # "diff_related_entities",
    # "pub_sub_topics",
    # "daphne_processes",
    # "silk",
    # "supervisord",
    # "approvals",
    # "user_settings",
    # "dns_records",
]

APP_TYPE = {
    # Django core apps
    "unfold": "third_party",
    "unfold.contrib.inlines": "third_party",
    "unfold.contrib.import_export": "third_party",
    "import_export": "third_party",
    "test_inlines": "custom",
    "django.contrib.admin": "django",
    "django.contrib.auth": "django",
    "django.contrib.contenttypes": "django",
    "django.contrib.sessions": "django",
    "django.contrib.messages": "django",
    "django.contrib.staticfiles": "django",
    "django.contrib.sites": "django",
    "django.db.migrations": "django",
    "bluewind": "custom",
    "users": "custom",
    "workspace_users": "custom",
    "workspaces": "custom",
    "functions": "custom",
    "function_calls": "custom",
    "files": "custom",
    "admin_autoregister": "custom",
    "debug_toolbar": "custom",
    "django_json_widget": "third_party",
    "domain_names": "custom",
    "forms": "custom",
    "form_data": "custom",
    "function_call_dependencies": "custom",
    "function_variables": "custom",
    "models": "custom",
    # "behave_django": "third_party",
    # "channels": "third_party",
    # "model_clone": "third_party",
    # "widget_tweaks": "third_party",
    # "slippers": "third_party",
    # # Local apps
    # "base_model_admin": "custom",
    # "auto_tests": "custom",
    # "people": "custom",
    # "chat_messages": "custom",
    # "db_graph": "custom",
    # "apollo_people_search": "custom",
    # "gmail_subscriptions": "custom",
    # "base_model.apps.BaseModelConfig": "custom",
    # "gmail_events": "custom",
    # "credentials": "custom",
    # "base64_utils": "custom",
    # "channel_wizzard": "custom",
    # "draft_messages": "custom",
    # "flows": "custom",
    # "entity": "custom",
    # "workspace_snapshots": "custom",
    # "rest_framework": "third_party",
    # "drf_spectacular": "third_party",
    # "drf_standardized_errors": "third_party",
    # "incoming_http_requests": "custom",
    # "flow_runs": "custom",
    # "step_runs": "step_runs",
    # "steps": "custom",
    # "actions": "custom",
    # "action_runs": "custom",
    # "recordings": "custom",
    # "file_watchers": "custom",
    # "file_system_changes": "custom",
    # "flow_parameters": "custom",
    # "apps": "custom",
    # "workspace_diffs": "custom",
    # "diff_related_entities": "custom",
    # "pub_sub_topics": "custom",
    # "daphne_processes": "custom",
    # "app_logs": "custom",
    # "supervisord": "custom",
    # "approvals": "custom",
    # "user_settings": "custom",
    # "dns_records": "custom",
    # "silk": "third_party",
}

custom_apps = [app for app, app_type in APP_TYPE.items() if app_type == "custom"]

os.environ["CUSTOM_APPS"] = json.dumps(custom_apps)

for app in INSTALLED_APPS:
    assert app in APP_TYPE, f"App '{app}' is in INSTALLED_APPS but not in APP_TYPE"

# Assert that all APP_TYPE entries correspond to an app in INSTALLED_APPS
for app in APP_TYPE:
    assert (
        app in INSTALLED_APPS
    ), f"App '{app}' is in APP_TYPE but not in INSTALLED_APPS"

# Middleware Configuration
MIDDLEWARE = [
    # CORE
    # "bluewind.middleware.custom_middleware",
    # "silk.middleware.SilkyMiddleware",
    # "bluewind.vscode_link_errors.VSCodeLinkMiddleware",
    # "debug_toolbar.middleware.DebugToolbarMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # DO NOT CHANGE THE ORDER OF THE MIDDLWARE BELOW
    # "allauth.account.middleware.AccountMiddleware",
    "bluewind.middleware.admin_middleware",
]

# Templates Configuration
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "bluewind/templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
            "debug": os.environ["DEBUG"],
        },
    },
]


# Database Configuration
DB_USERNAME = os.environ["DB_USERNAME"]
DB_PASSWORD = os.environ["DB_PASSWORD"]
DB_HOST = os.environ["DB_HOST"]
DB_PORT = os.environ["DB_PORT"]
DB_NAME = os.environ["DB_NAME"]

DATABASES = {
    "default": {
        "ENGINE": "django_db_geventpool.backends.postgresql_psycopg3",
        "NAME": DB_NAME,
        "USER": DB_USERNAME,
        "PASSWORD": DB_PASSWORD,
        "HOST": DB_HOST,
        "PORT": DB_PORT,
        "CONN_MAX_AGE": 0,
        "OPTIONS": {
            "sslmode": "disable",
            "MAX_CONNS": 100,  # Adjust based on your needs
            "REUSE_CONNS": 100,  # Adjust based on your needs
        },
        "ATOMIC_REQUESTS": True,  # Add this line
    }
}

NO_LOG_TABLES = []
# from psycopg_pool import ConnectionPool

# DATABASES["default"]["OPTIONS"]["pool_class"] = ConnectionPool

# Authentication and Authorization
AUTH_USER_MODEL = "users.User"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    # "allauth.account.auth_backends.AuthenticationBackend",
]

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Security Settings
CSRF_TRUSTED_ORIGINS = os.environ["CSRF_TRUSTED_ORIGINS"].split(",")
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# AllAuth Settings
SITE_ID = 1
# LOGIN_URL = "/workspaces/2/accounts/login/"
# LOGIN_REDIRECT_URL = "/workspaces/2/admin/next"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = "email"
# ACCOUNT_EMAIL_VERIFICATION = "mandatory"

# Social Account Providers
# SOCIALACCOUNT_PROVIDERS = {
#     "google": {
#         "APP": {
#             "client_id": os.environ["GOOGLE_OAUTH_CLIENT_ID"],
#             "secret": os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
#         }
#     }
# }


# Debug Toolbar Settings
INTERNAL_IPS = ["127.0.0.1"]
DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TEMPLATE_CONTEXT": True,
    "ENABLE_STACKTRACES": True,
    "STACKTRACE_DEPTH": 20,  # Reduced from 10000
    "SHOW_TOOLBAR_CALLBACK": "bluewind.toolbar.show_toolbar",
}

# Email Configuration (AWS SES)
# EMAIL_BACKEND = "django_ses.SESBackend"
# AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
# AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
# AWS_SES_REGION_NAME = "us-west-2"
# AWS_SES_REGION_ENDPOINT = "email.us-west-2.amazonaws.com"
# USE_SES_V2 = True
# DEFAULT_FROM_EMAIL = "wayne@bluewind.ai"

# Miscellaneous
SALT_KEY = os.environ["SALT_KEY"]
ALLAUTH_UI_THEME = "light"
TEST_RUNNER = "bluewind.test_runner.NoDbTestRunner"
GRAPH_MODELS = {
    "all_applications": True,
    "group_models": True,
}

# Environment-specific settings
if os.environ["ENVIRONMENT"] == "prod":
    SITE_URL = os.environ["SITE_URL"]
else:
    SITE_URL = "https://green.bluewind.ai"


REST_FRAMEWORK = {
    # ... other settings ...
    "EXCEPTION_HANDLER": "drf_standardized_errors.handler.exception_handler",
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": [],
}

CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_TRUSTED_ORIGINS = ["http://localhost:8000"]  # Add your domain here
CSRF_COOKIE_SAMESITE = None
DRF_STANDARDIZED_ERRORS = {"ENABLE_IN_DEBUG_FOR_UNHANDLED_EXCEPTIONS": True}


SPECTACULAR_SETTINGS = {
    "TITLE": "Your API",
    "DESCRIPTION": "Your project description",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# DEFAULT_EXCEPTION_REPORTER_FILTER = (
#     "bluewind.vscode_link_errors.VSCodeLinkExceptionReporterFilter"
# )

# Suppress the RuntimeWarning about accessing the database during app initialization
warnings.filterwarnings(
    "ignore",
    message=".*Accessing the database during app initialization is discouraged.*",
    category=RuntimeWarning,
)

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

SILKY_PYTHON_PROFILER = False

from django.utils.translation import gettext_lazy as _

UNFOLD = {
    "SITE_TITLE": "Bluewind",
    "SITE_HEADER": "Bluewind",
    "SHOW_HISTORY": False,
    "SHOW_VIEW_ON_SITE": False,
    "SHOW_BREADCRUMBS": False,
    "SIDEBAR": {
        "show_search": False,  # Search in applications and models names
        "show_all_applications": False,  # Dropdown with all applications and models,
        "navigation": [
            {
                "title": _("Navigation"),
                "separator": True,  # Top border
                "collapsible": True,  # Collapsible group of links
                "items": [],
            },
        ],
    },
    "TABS": [],
}
