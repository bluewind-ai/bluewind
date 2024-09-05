import os
from pathlib import Path

import environ

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent

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
    # Local apps
    "users",
    "api_providers",
    "workspaces",
    "base_model_admin",
    "auto_tests",
    "chat_messages",
    "people",
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
    "admin_autoregister",
    "forms",
]

# Middleware Configuration
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "debug_toolbar.middleware.DebugToolbarMiddleware",
    "bluewind.admin_site.admin_login_middleware",
]

# Templates Configuration
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "channel_wizzard", "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
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
            "sslmode": "require",
        },
    }
}

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
LOGIN_URL = "/accounts/login/"
LOGIN_REDIRECT_URL = "/admin"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_EMAIL_VERIFICATION = "mandatory"

# Social Account Providers
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": os.environ["GOOGLE_OAUTH_CLIENT_ID"],
            "secret": os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
        }
    }
}

# Logging Configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "rich.logging.RichHandler",
            "rich_tracebacks": True,
            "tracebacks_show_locals": True,
        },
    },
    "loggers": {
        "": {
            "level": "DEBUG",
            "handlers": ["console"],
        },
        "django.db.backends": {
            "level": "DEBUG",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}

# Debug Toolbar Settings
INTERNAL_IPS = ["127.0.0.1"]
DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TEMPLATE_CONTEXT": True,
    "ENABLE_STACKTRACES": True,
    "STACKTRACE_DEPTH": 10000,
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
