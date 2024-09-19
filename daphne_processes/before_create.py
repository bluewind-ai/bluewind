def daphne_process_before_create(daphne_process):
    pass
    # try:
    #     result = subprocess.run(
    #         [
    #             "gunicorn",
    #             "-c",
    #             "gunicorn_config.py",
    #             "--bind",
    #             "127.0.0.1:8001",
    #             "bluewind.wsgi:application",
    #         ],
    #         check=True,
    #         capture_output=True,
    #         text=True,
    #     ))
    #     return result
    # except subprocess.CalledProcessError as e:
    #     raise  # Re-raise the exception after printing the error information
