import os
from pathlib import Path

import environ

from bluewind.logging_config import get_logging_config

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent
LOGGING = get_logging_config(BASE_DIR)

# Core Django Settings
SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = os.environ["DEBUG"]
ALLOWED_HOSTS = environ.Env().list("ALLOWED_HOSTS")
ROOT_URLCONF = "bluewind.urls"
WSGI_APPLICATION = "bluewind.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Application Definition
INSTALLED_APPS = [
    # Django core apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "django.db.migrations",
    "bluewind",
    # Third-party apps
    "allauth_ui",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "behave_django",
    "channels",
    "debug_toolbar",
    "django_extensions",
    "django_object_actions",
    "model_clone",
    "slippers",
    "widget_tweaks",
    "django_json_widget",
    # Local apps
    "users",
    "api_providers",
    "workspaces",
    "base_model_admin",
    "auto_tests",
    "people",
    "chat_messages",
    "db_graph",
    "apollo_people_search",
    "gmail_subscriptions",
    "base_model.apps.BaseModelConfig",
    "gmail_events",
    "webhook_tester",
    "credentials",
    "base64_utils",
    # This should be last
    "channel_wizzard",
    "draft_messages",
    "flows",
    "entity",
    "workspace_snapshots",
    "rest_framework",
    "drf_spectacular",
    "api_calls",
    "drf_standardized_errors",
    "incoming_http_requests",
    "app_logs",
    "admin_autoregister",
]

APP_TYPE = {
    # Django core apps
    "django.contrib.admin": "django",
    "django.contrib.auth": "django",
    "django.contrib.contenttypes": "django",
    "django.contrib.sessions": "django",
    "django.contrib.messages": "django",
    "django.contrib.staticfiles": "django",
    "django.contrib.sites": "django",
    "django.db.migrations": "django",
    "bluewind": "custom",
    # Third-party apps
    "allauth_ui": "third_party",
    "allauth": "third_party",
    "allauth.account": "third_party",
    "allauth.socialaccount": "third_party",
    "allauth.socialaccount.providers.google": "third_party",
    "behave_django": "third_party",
    "channels": "third_party",
    "debug_toolbar": "third_party",
    "django_extensions": "third_party",
    "django_object_actions": "third_party",
    "model_clone": "third_party",
    "widget_tweaks": "third_party",
    "slippers": "third_party",
    "django_json_widget": "third_party",
    # Local apps
    "users": "custom",
    "api_providers": "custom",
    "workspaces": "custom",
    "base_model_admin": "custom",
    "auto_tests": "custom",
    "people": "custom",
    "chat_messages": "custom",
    "db_graph": "custom",
    "apollo_people_search": "custom",
    "gmail_subscriptions": "custom",
    "base_model.apps.BaseModelConfig": "custom",
    "gmail_events": "custom",
    "webhook_tester": "custom",
    "credentials": "custom",
    "base64_utils": "custom",
    "channel_wizzard": "custom",
    "draft_messages": "custom",
    "flows": "custom",
    "entity": "custom",
    "workspace_snapshots": "custom",
    "rest_framework": "third_party",
    "drf_spectacular": "third_party",
    "api_calls": "custom",
    "drf_standardized_errors": "third_party",
    "admin_autoregister": "custom",
    "incoming_http_requests": "custom",
    "app_logs": "custom",
}

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
    "bluewind.middleware.custom_middleware",
    "bluewind.vscode_link_errors.VSCodeLinkMiddleware",
    "debug_toolbar.middleware.DebugToolbarMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # DO NOT CHANGE THE ORDER OF THE MIDDLWARE BELOW
    "allauth.account.middleware.AccountMiddleware",
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
        "ENGINE": "django.db.backends.postgresql",
        "NAME": DB_NAME,
        "USER": DB_USERNAME,
        "PASSWORD": DB_PASSWORD,
        "HOST": DB_HOST,
        "PORT": DB_PORT,
        "CONN_MAX_AGE": 600,
        "OPTIONS": {
            "sslmode": "disable",
        },
    }
}

NO_LOG_TABLES = []


# Authentication and Authorization
AUTH_USER_MODEL = "users.User"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
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
LOGIN_URL = "/workspaces/2/accounts/login/"
LOGIN_REDIRECT_URL = "/workspaces/2/admin"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = "email"
# ACCOUNT_EMAIL_VERIFICATION = "mandatory"

# Social Account Providers
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": os.environ["GOOGLE_OAUTH_CLIENT_ID"],
            "secret": os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
        }
    }
}


# Debug Toolbar Settings
INTERNAL_IPS = ["127.0.0.1"]
DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TEMPLATE_CONTEXT": True,
    "ENABLE_STACKTRACES": True,
    "STACKTRACE_DEPTH": 20,  # Reduced from 10000
    "SHOW_TOOLBAR_CALLBACK": "bluewind.toolbar.show_toolbar",
}

# Email Configuration (AWS SES)
EMAIL_BACKEND = "django_ses.SESBackend"
AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
AWS_SES_REGION_NAME = "us-west-2"
AWS_SES_REGION_ENDPOINT = "email.us-west-2.amazonaws.com"
USE_SES_V2 = True
DEFAULT_FROM_EMAIL = "wayne@bluewind.ai"

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
