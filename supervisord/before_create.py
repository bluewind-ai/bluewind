import subprocess


def supervisord_before_create(supervisord):
    return subprocess.run(
        ["supervisord", "-c", supervisord.CONFIG_FILE],
    )
