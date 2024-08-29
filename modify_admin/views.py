from django.core.wsgi import get_wsgi_application

def workspace_wsgi_application(environ, start_response):
    path_info = environ.get('PATH_INFO', '')
    if path_info.startswith('/wks_'):
        # Extract workspace_id
        parts = path_info.split('/')
        workspace_id = parts[1][4:]  # Remove 'wks_' prefix
        
        # Modify SCRIPT_NAME and PATH_INFO
        environ['SCRIPT_NAME'] = environ.get('SCRIPT_NAME', '') + f'/wks_{workspace_id}'
        environ['PATH_INFO'] = '/' + '/'.join(parts[2:])
        
        # Add workspace_id to the environment
        environ['WORKSPACE_ID'] = workspace_id

    return get_wsgi_application()(environ, start_response)

application = workspace_wsgi_application