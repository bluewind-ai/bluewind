bind = "127.0.0.1:8000"
worker_class = "gevent"
workers = 1
worker_connections = 10000
max_requests = 10000
timeout = 30
reload = True
reload_engine = "auto"
