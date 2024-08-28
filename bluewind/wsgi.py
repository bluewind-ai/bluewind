import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bluewind.settings_prod')

def workspace_wsgi_middleware(application):
    def wrapper(environ, start_response):
        path_info = environ.get('PATH_INFO', '')
        if path_info.startswith('/wks_'):
            # Extract workspace_id including the 'wks_' prefix
            parts = path_info.split('/')
            workspace_id = parts[1]  # This will be 'wks_2121211'
            
            # Modify SCRIPT_NAME and PATH_INFO
            environ['SCRIPT_NAME'] = environ.get('SCRIPT_NAME', '') + f'/{workspace_id}'
            environ['PATH_INFO'] = '/' + '/'.join(parts[2:])
            
            # Add workspace_id to the environment
            environ['WORKSPACE_ID'] = workspace_id

        return application(environ, start_response)
    return wrapper

# Get the default Django WSGI application
django_application = get_wsgi_application()

# Apply our middleware
application = workspace_wsgi_middleware(django_application)