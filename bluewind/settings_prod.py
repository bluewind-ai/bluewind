# from local_secrets import load_secrets_to_env


# load_secrets_to_env("prod-env")
import os


import os
from pathlib import Path
import environ

# env = environ.Env(
#     # set casting, default value
#     DEBUG=(bool, False)
# )

BASE_DIR = Path(__file__).resolve().parent.parent

# environ.Env.read_env(os.path.join(BASE_DIR, '.env'))


INSTALLED_APPS = [
    # 'django_extensions',
    "allauth_ui",
    "model_clone",
    "workspace_filter",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    ## User sessions
    "user_sessions",
    "api_providers",
    ## User sessions
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "workspaces",
    "public_id",
    "base_model_admin",
    "auto_tests",
    # debugging
    "django.contrib.sites",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    # LOCAL APPS'
    "chat_messages",
    "people",
    # tests
    "behave_django",
    # AUTH PROVIDERS
    "db_graph",
    "homepage",
    "apollo_people_search",
    "channels",
    "gmail_subscriptions",
    "django_object_actions",
    "base_model.apps.BaseModelConfig",
    "allauth.socialaccount.providers.google",
    "widget_tweaks",
    "slippers",
]

ALLAUTH_UI_THEME = "light"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    ## third party package
    "user_sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "bluewind.allauth_redirect.WksRedirectMiddleware",
]

ROOT_URLCONF = "bluewind.urls"

STATIC_URL = "/static/"

STATICFILES_DIRS = [
    BASE_DIR / "static",
]

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

SECRET_KEY = os.environ["SECRET_KEY"]

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ["DEBUG"]

ALLOWED_HOSTS = environ.Env().list("ALLOWED_HOSTS")

WSGI_APPLICATION = "bluewind.wsgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/


# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


GRAPH_MODELS = {
    "all_applications": True,
    "group_models": True,
}

AUTHENTICATION_BACKENDS = [
    # Needed to login by username in Django admin, regardless of `allauth`
    "admin_sso.auth.DjangoSSOAuthBackend",
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
    # `allauth` specific authentication methods, such as login by email
    # 'allauth.account.auth_backends.AuthenticationBackend',
]


SOCIALACCOUNT_PROVIDERS = {
    "google": {
        # For each OAuth based provider, either add a ``SocialApp``
        # (``socialaccount`` app) containing the required client
        # credentials, or list them here:
        "APP": {
            "client_id": os.environ["GOOGLE_OAUTH_CLIENT_ID"],
            "secret": os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
            # 'key': ''
        }
    }
}


LOGIN_URL = "/accounts/login/"
ACCOUNT_EMAIL_REQUIRED = True  # if you want to require email
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = "email"
LOGIN_REDIRECT_URL = "/admin"
# ACCOUNT_EMAIL_VERIFICATION = 'mandatory'  # or 'optional'
SITE_ID = 1

if os.environ["ENVIRONMENT"] == "prod":
    SITE_URL = os.environ["SITE_URL"]
else:
    SITE_URL = "https://green.bluewind.ai"


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,  # Change this to False
    "handlers": {
        "console": {
            "class": "rich.logging.RichHandler",
            "rich_tracebacks": True,
            "tracebacks_show_locals": True,
        },
    },
    "loggers": {
        "": {  # Root logger
            "level": "DEBUG",
            "handlers": ["console"],
        },
        "django.db.backends": {
            "level": "DEBUG",
            "handlers": ["console"],
            "propagate": False,  # Add this line
        },
    },
}

INTERNAL_IPS = [
    "127.0.0.1",
]

SESSION_ENGINE = "user_sessions.backends.db"

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Take environment variables from .env file
# if os.environ['ENVIRONMENT') != 'prod' and os.environ['ENVIRONMENT') != 'staging']
#     if os.environ['ENVIRONMENT') == 'test']
#         environ.Env.read_env(os.path.join(BASE_DIR, '.env'))
#         os.environ['ENVIRONMENT'] = 'test'
#     else:
#         environ.Env.read_env(os.path.join(BASE_DIR, '.env'))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!

# GOOGLE_OAUTH_CLIENT_ID = env.list('GOOGLE_OAUTH_CLIENT_ID')
# GOOGLE_OAUTH_CLIENT_SECRET= env.list('GOOGLE_OAUTH_CLIENT_SECRET')

# Application definition

INSTALLED_APPS += ["debug_toolbar", "admin_sso"]

WSGI_APPLICATION = "bluewind.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DB_USERNAME = os.environ["DB_USERNAME"]
DB_PASSWORD = os.environ["DB_PASSWORD"]
DB_HOST = os.environ["DB_HOST"]
DB_PORT = os.environ["DB_PORT"]
DB_NAME = os.environ["DB_NAME"]

# DATABASE_URL = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
DB_INFO = {
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
DATABASES = {"default": DB_INFO}


CSRF_TRUSTED_ORIGINS = os.environ["CSRF_TRUSTED_ORIGINS"].split(",")


# if 'test' in sys.argv:
#     DATABASES['default']['USER'] = 'test_user'
#     DATABASES['default']['PASSWORD'] = 'test_password'

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators


DEBUG_TOOLBAR_CONFIG = {
    # 'EXTRA_SIGNALS': True,
    "SHOW_TEMPLATE_CONTEXT": True,
    "ENABLE_STACKTRACES": True,
    # 'SHOW_TOOLBAR_CALLBACK': lambda request: True,
    "STACKTRACE_DEPTH": 10000,  # Increase this number as needed
    "SHOW_TOOLBAR_CALLBACK": "bluewind.toolbar.show_toolbar",
}

DEBUG_TOOLBAR_PANELS = [
    "debug_toolbar.panels.versions.VersionsPanel",
    "debug_toolbar.panels.timer.TimerPanel",
    "debug_toolbar.panels.settings.SettingsPanel",
    "debug_toolbar.panels.headers.HeadersPanel",
    "debug_toolbar.panels.request.RequestPanel",
    "debug_toolbar.panels.sql.SQLPanel",
    "debug_toolbar.panels.staticfiles.StaticFilesPanel",
    "debug_toolbar.panels.templates.TemplatesPanel",
    "debug_toolbar.panels.cache.CachePanel",
    "debug_toolbar.panels.signals.SignalsPanel",
    "debug_toolbar.panels.logging.LoggingPanel",
    "debug_toolbar.panels.redirects.RedirectsPanel",
]


# LOGGING = {
#     'version': 1,
#     'filters': {
#         'require_debug_true': {
#             '()': 'django.utils.log.RequireDebugTrue',
#         }
#     },
#     'handlers': {
#         'console': {
#             'level': 'DEBUG',
#             'filters': ['require_debug_true'],
#             'class': 'logging.StreamHandler',
#         }
#     },
#     'loggers': {
#         'django.db.backends': {
#             'level': 'DEBUG',
#             'handlers': ['console'],
#         }
#     }
# }


# dummy change to test cia

MIDDLEWARE += [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
    # 'workspace_filter.middleware.WorkspaceFilterMiddleware',
]
# cdnsjkcdnsjkcndsk

TEST_RUNNER = "bluewind.test_runner.NoDbTestRunner"

DJANGO_ADMIN_SSO_OAUTH_CLIENT_ID = os.environ["GOOGLE_OAUTH_CLIENT_ID"]
DJANGO_ADMIN_SSO_OAUTH_CLIENT_SECRET = os.environ["GOOGLE_OAUTH_CLIENT_SECRET"]

AUTH_USER_MODEL = "workspace_filter.User"

ACCOUNT_ADAPTER = "bluewind.allauth_adapter.CustomAccountAdapter"

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# These are optional if you are using AWS IAM Roles https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html
AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
# https://docs.aws.amazon.com/cli/v1/userguide/cli-configure-files.html
# AWS_SESSION_PROFILE = 'YOUR-PROFILE-NAME'
# Additionally, if you are not using the default AWS region of us-east-1,
# you need to specify a region, like so:
AWS_SES_REGION_NAME = "us-west-2"
AWS_SES_REGION_ENDPOINT = "email.us-west-2.amazonaws.com"

# If you want to use the SESv2 client
USE_SES_V2 = True

DEFAULT_FROM_EMAIL = "wayne@bluewind.ai"
