# from .settings_base import *

# if os.environ.get('ENVIRONMENT') != 'prod' and os.environ.get('ENVIRONMENT') != 'staging':
#     if os.environ.get('ENVIRONMENT') == 'test':
#         environ.Env.read_env(os.path.join(BASE_DIR, '.env'))
#         os.environ['ENVIRONMENT'] = 'test'
#     else:
#         environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# DEBUG = True

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
#     }
# }


# ALLOWED_HOSTS = ["*"]

# ROOT_URLCONF = 'bluewind.urls'