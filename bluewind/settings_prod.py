from local_secrets import load_secrets_to_env


load_secrets_to_env("prod-env")
import os
print(os.environ)


import os
from pathlib import Path
import environ

env = environ.Env(
    # set casting, default value
    DEBUG=(bool, False)
)

BASE_DIR = Path(__file__).resolve().parent.parent

environ.Env.read_env(os.path.join(BASE_DIR, '.env'))


INSTALLED_APPS = [
    # 'django_extensions',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',

    ## User sessions
    'user_sessions',
    'api_providers',
    ## User sessions

    'django.contrib.messages',
    'django.contrib.staticfiles',
    'workspaces',
    'public_id',
    'base_model_admin', 
    'auto_tests',

    # debugging

    # LOCAL APPS'
    'chat_messages',
    'leads',

    # tests
    'behave_django',
    # AUTH PROVIDERS
    'db_graph',

    'homepage',
    # 'core',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    
    ## third party package
    'user_sessions.middleware.SessionMiddleware',

    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    # "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = 'bluewind.urls'

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / "static",
]

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG')

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

WSGI_APPLICATION = 'bluewind.wsgi.application'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/


# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


GRAPH_MODELS = {
    'all_applications': True,
    'group_models': True,
}

AUTHENTICATION_BACKENDS = [
    # Needed to login by username in Django admin, regardless of `allauth`
    'django.contrib.auth.backends.ModelBackend',

    # `allauth` specific authentication methods, such as login by email
    # 'allauth.account.auth_backends.AuthenticationBackend',
]

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        # For each OAuth based provider, either add a ``SocialApp``
        # (``socialaccount`` app) containing the required client
        # credentials, or list them here:
        'APP': {
            'client_id': None,
            'secret': None,
            'key': ''
        }
    }
}

LOGIN_URL='/'
ACCOUNT_EMAIL_REQUIRED = True  # if you want to require email
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'  # or 'optional'
SITE_ID = 1



LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    # 'loggers': {
    #     'django.db.backends': {
    #         'level': 'DEBUG',
    #         'handlers': ['console'],
    #     },
    # },
}

INTERNAL_IPS = [
    '127.0.0.1',
]

SESSION_ENGINE = 'user_sessions.backends.db'

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Take environment variables from .env file
if os.environ.get('ENVIRONMENT') != 'prod' and os.environ.get('ENVIRONMENT') != 'staging':
    if os.environ.get('ENVIRONMENT') == 'test':
        environ.Env.read_env(os.path.join(BASE_DIR, '.env'))
        os.environ['ENVIRONMENT'] = 'test'
    else:
        environ.Env.read_env(os.path.join(BASE_DIR, '.env'))




# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!

# GOOGLE_OAUTH_CLIENT_ID = env.list('GOOGLE_OAUTH_CLIENT_ID')
# GOOGLE_OAUTH_CLIENT_SECRET= env.list('GOOGLE_OAUTH_CLIENT_SECRET')

# Application definition

INSTALLED_APPS += [
    'debug_toolbar',
]

WSGI_APPLICATION = 'bluewind.wsgi.application'

import sys


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DB_USERNAME = os.environ.get('DB_USERNAME')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_HOST = os.environ.get('DB_HOST')
DB_PORT = os.environ.get('DB_PORT')
DB_NAME = os.environ.get('DB_NAME', 'postgres')

# DATABASE_URL = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
DB_INFO = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': 'postgres',
    'USER': DB_USERNAME,
    'PASSWORD': DB_PASSWORD,
    'HOST': DB_HOST,
    'PORT': DB_PORT,
    'CONN_MAX_AGE': 600,
    'OPTIONS': {
        'sslmode': 'require',
    },
}
DATABASES = {
    'default': DB_INFO
}

if os.environ.get('ENVIRONMENT') != 'prod':
    print('DATABASES:', DATABASES, 'DB_INFO:', DB_INFO)
    

CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',')


# if 'test' in sys.argv:
#     DATABASES['default']['USER'] = 'test_user'
#     DATABASES['default']['PASSWORD'] = 'test_password'

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators


DEBUG_TOOLBAR_CONFIG = {
    # 'EXTRA_SIGNALS': True,
    'SHOW_TEMPLATE_CONTEXT': True,
    'ENABLE_STACKTRACES': True,
    'SHOW_TOOLBAR_CALLBACK': lambda request: True,
    'STACKTRACE_DEPTH': 10000,  # Increase this number as needed
}

DEBUG_TOOLBAR_PANELS = [
    'debug_toolbar.panels.versions.VersionsPanel',
    'debug_toolbar.panels.timer.TimerPanel',
    'debug_toolbar.panels.settings.SettingsPanel',
    'debug_toolbar.panels.headers.HeadersPanel',
    'debug_toolbar.panels.request.RequestPanel',
    'debug_toolbar.panels.sql.SQLPanel',
    'debug_toolbar.panels.staticfiles.StaticFilesPanel',
    'debug_toolbar.panels.templates.TemplatesPanel',
    'debug_toolbar.panels.cache.CachePanel',
    'debug_toolbar.panels.signals.SignalsPanel',
    'debug_toolbar.panels.logging.LoggingPanel',
    'debug_toolbar.panels.redirects.RedirectsPanel',
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
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]
# cdnsjkcdnsjkcndsk

TEST_RUNNER = 'bluewind.test_runner.NoDbTestRunner'
