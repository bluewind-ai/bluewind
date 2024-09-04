import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")


def workspace_wsgi_middleware(application):
    def wrapper(environ, start_response):
        path_info = environ.get("PATH_INFO", "")
        parts = path_info.split("/")
        # if parts[2].startswith('accounts'):
        #         pass
        if path_info.startswith("/static"):
            pass
        elif path_info.startswith("/workspaces/"):
            parts = path_info.split("/")
            workspace_id = parts[2]
            # strip out the 'workspaces/' prefix
            # Modify SCRIPT_NAME and PATH_INFO
            environ["SCRIPT_NAME"] = f"/workspaces/{workspace_id}"
            environ["PATH_INFO"] = "/" + "/".join(parts[3:])

            environ["WORKSPACE_ID"] = workspace_id
        return application(environ, start_response)

    return wrapper


# Get the default Django WSGI application
django_application = get_wsgi_application()

# Apply our middleware
application = workspace_wsgi_middleware(django_application)
