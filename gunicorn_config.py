from flows.on_exit_handler.flows import on_exit_handler

# Gunicorn configuration
worker_int = on_exit_handler
workers = 1

bind = "0.0.0.0:8000"
max_requests = 1000
timeout = 30


def on_starting(server):
    from flows.bootstrap.flows import bootstrap

    bootstrap()


# You can add other Gunicorn-specific settings here if needed
