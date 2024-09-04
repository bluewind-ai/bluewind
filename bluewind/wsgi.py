import os
from urllib.parse import parse_qs

from bluewind import logger
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
            logger.info("Workspace ID: %s", workspace_id)
            logger.info("PATH_INFO: %s", environ["PATH_INFO"])
            logger.info("SCRIPT_NAME: %s", environ["SCRIPT_NAME"])
            logger.info("WORKSPACE_ID: %s", environ["WORKSPACE_ID"])
        else:
            WHITELIST = [
                "/health/",
                "/health",
                "/favicon.ico",
                "/favicon.ico/",
                "/",
                "/admin/login/",
                "/admin/login",
                "/admin/",
                "/admin",
                "/admin/logout/",
                "/admin/logout",
                "/accounts",
                "/accounts/login",
                "/accounts/login/",
            ]

            if path_info not in WHITELIST:
                if path_info == "/oauth2callback/":
                    # Parse the query string
                    query_string = environ.get("QUERY_STRING", "")
                    parsed_qs = parse_qs(query_string)

                    # Extract the state from the query string
                    state = parsed_qs.get("state", [""])[0]
                    if state.startswith("workspaces/"):
                        workspace_id, _ = state.split(":", 1)

                        environ["SCRIPT_NAME"] = (
                            environ.get("SCRIPT_NAME", "") + f"/{workspace_id}"
                        )
                        # environ['PATH_INFO'] = '/' + '/'.join(parts[2:])

                        environ["WORKSPACE_ID"] = workspace_id
                    else:
                        pass
                else:
                    pass
                    # raise ValueError("Invalid path", path_info)
        return application(environ, start_response)

    return wrapper


# Get the default Django WSGI application
django_application = get_wsgi_application()

# Apply our middleware
application = workspace_wsgi_middleware(django_application)
