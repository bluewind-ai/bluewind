import subprocess


def run_bluewind():
    result = subprocess.run(
        ["python", "manage.py", "rungunicorn"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout
