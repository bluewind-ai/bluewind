import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bluewind.settings_prod')

def workspace_wsgi_middleware(application):
    def wrapper(environ, start_response):
        print('go there:cdnsjcdsjk')
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
            WHITELIST = ['/health/', '/favicon.ico']
            if path_info not in WHITELIST:
                if path_info != '/oauth2callback/':
                    
                    raise ValueError("Invalid path")
                print('cdsmcjdsjkcndsjkcndsks')
                print(environ)
                # the environ["QUERY_STING"] has something like this
                'QUERY_STRING': 'state=wks_50204447a6c5:e30e9772c472e800e401642331b2fa71&code=4/0AQlEd8wXKBwcgkziLoek3uH92DiOgY4a6MUwd5mLC6vJ7nLO_En-rb-LBKzygMFUZzTERg&scope=email%20profile%20https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profile%20openid%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send&authuser=2&hd=bluewind.ai&prompt=consent'
                # I need to get the state and put it in the environ
        return application(environ, start_response)
    return wrapper

# Get the default Django WSGI application
django_application = get_wsgi_application()

# Apply our middleware
application = workspace_wsgi_middleware(django_application)