import subprocess


def run_ruff():
    result = subprocess.run(
        ["ruff", "check", "."], capture_output=True, text=True, check=True
    )
    return result.stdout
