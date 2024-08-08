import os
import subprocess
import sys
import argparse

def run_command(command, capture_output=True):
    print(f"Executing: {command}")
    if capture_output:
        process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        output = stdout.decode()
        error = stderr.decode()
        print(output)
        if error:
            print(f"Error output:\n{error}")
        if process.returncode != 0:
            print(f"Error executing command: {command}")
            sys.exit(1)
        return output
    else:
        subprocess.run(command, shell=True, check=True)

def get_test_commands():
    return [
        "pip install --upgrade pip",
        "pip install -e ..",
        "pip install -r requirements/py3.txt",
        "python ./runtests.py"
    ]

def run_locally():
    os.chdir("tests")
    print(f"Current working directory: {os.getcwd()}")

    run_command("python3 -m venv venv")
    
    test_commands = " && ".join(get_test_commands())
    run_command(f"source venv/bin/activate && {test_commands}")

def main():
    print("Starting the script...")
    print("Running locally...")
    run_locally()
    print("Script completed.")

if __name__ == "__main__":
    main()