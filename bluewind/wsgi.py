import os
from django.core.wsgi import get_wsgi_application
from urllib.parse import parse_qs

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bluewind.settings_prod')

def workspace_wsgi_middleware(application):
    def wrapper(environ, start_response):
        path_info = environ.get('PATH_INFO', '')
        if path_info.startswith('/wks_'):
            # Extract workspace_public_id including the 'wks_' prefix
            parts = path_info.split('/')
            workspace_public_id = parts[1]  # This will be 'wks_2121211'
            assert workspace_public_id.startswith('wks_')
            # Modify SCRIPT_NAME and PATH_INFO
            environ['SCRIPT_NAME'] = environ.get('SCRIPT_NAME', '') + f'/{workspace_public_id}'
            environ['PATH_INFO'] = '/' + '/'.join(parts[2:])
            
            # Add workspace_public_id to the environment
            environ['WORKSPACE_PUBLIC_ID'] = workspace_public_id
        else:
            WHITELIST = ['/health/', '/favicon.ico', '/', '/admin/login/', '/admin/', '/admin/logout/']
            if path_info not in WHITELIST:
                if path_info == '/oauth2callback/':
                    print('cdsmcjdsjkcndsjkcndsks')
                    print(environ)
                    
                    # Parse the query string
                    query_string = environ.get('QUERY_STRING', '')
                    parsed_qs = parse_qs(query_string)
                    
                    # Extract the state from the query string
                    state = parsed_qs.get('state', [''])[0]
                    if state.startswith('wks_'):
                        # Extract the workspace_public_id from the state
                        workspace_public_id, _ = state.split(':', 1)
                        
                        # Add workspace_public_id to the environment
                        environ['SCRIPT_NAME'] = environ.get('SCRIPT_NAME', '') + f'/{workspace_public_id}'
                        # environ['PATH_INFO'] = '/' + '/'.join(parts[2:])
                        
                        # Add workspace_public_id to the environment
                        environ['WORKSPACE_PUBLIC_ID'] = workspace_public_id
                    else:
                        raise ValueError("Invalid state in OAuth2 callback")
                else:
                    raise ValueError("Invalid path", path_info)
        return application(environ, start_response)
    return wrapper

# Get the default Django WSGI application
django_application = get_wsgi_application()

# Apply our middleware
application = workspace_wsgi_middleware(django_application)