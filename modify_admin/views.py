from django.core.wsgi import get_wsgi_application


def workspace_wsgi_application(environ, start_response):
    path_info = environ.get("PATH_INFO", "")
    if path_info.startswith("/wks_"):
        # Extract workspace_public_id
        parts = path_info.split("/")
        workspace_public_id = parts[1]

        # Modify SCRIPT_NAME and PATH_INFO
        environ["SCRIPT_NAME"] = (
            environ.get("SCRIPT_NAME", "") + f"/{workspace_public_id}"
        )
        environ["PATH_INFO"] = "/" + "/".join(parts[2:])

        # Add workspace_public_id to the environment
        environ["WORKSPACE_PUBLIC_ID"] = workspace_public_id

    return get_wsgi_application()(environ, start_response)


application = workspace_wsgi_application
