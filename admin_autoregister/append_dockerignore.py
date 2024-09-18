import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def append_to_dockerignore(app_configs):
    dockerignore_path = os.path.join(base_dir, ".dockerignore")

    with open(dockerignore_path, "a") as f:
        for app_config in app_configs:
            f.write(f"!{app_config.label}\n")
