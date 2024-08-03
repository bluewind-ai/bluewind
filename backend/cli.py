import os
import re
import shutil
import signal
import sys
import subprocess
import platform
import click

# Default values
DEFAULT_DB_NAME = "myproject_db"
DEFAULT_DB_USER = "myproject_user"
DEFAULT_DB_PASSWORD = "myproject_password"

@click.group()
def cli():
    """Project setup script"""
    pass

@cli.command()
def version():
    """Display the version of the project setup tool"""
    click.echo("Project Setup Tool v1.0")

def clean_output_line(line):
    # Remove ANSI escape sequences
    clean_line = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', line)
    
    # Remove progress indicators and other dynamic content
    clean_line = re.sub(r'\d+%|\[=*\]', '', clean_line)
    
    # Remove timestamp-like patterns
    clean_line = re.sub(r'\d{2}:\d{2}:\d{2}', '', clean_line)
    
    # Remove extra whitespace
    clean_line = re.sub(r'\s+', ' ', clean_line).strip()
    
    return clean_line


@cli.command()
@click.option('--default', is_flag=True, help='Use default database settings')
def install_unix_docker(default):
    """Set up the project using a minimal Docker environment"""
    print("Setting up the project in a minimal Docker environment!")

    try:
        # Check if Docker is installed
        subprocess.run(["docker", "--version"], check=True)
        print("Docker is already installed.")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Docker is not installed. We will install it now.")
        subprocess.run(["apt-get", "update"], check=True)
        subprocess.run(["apt-get", "install", "-y", "docker.io"], check=True)

    # Create a minimal Dockerfile
    with open("Dockerfile", "w") as f:
        f.write("""
FROM debian:bullseye-slim
WORKDIR /app
CMD ["/bin/bash"]
""")
    print("Created minimal Dockerfile.")

    # Build the Docker image
    print("Building Docker image...")
    subprocess.run("docker build -t myproject_minimal .", shell=True, check=True)

    # Run the bash run install-unix command inside the Docker container
    print("Running 'bash run install-unix' inside Docker container...")
    
    default_flag = '--default' if default else ''

    docker_run_command = f"docker run -it --rm -v $(pwd):/app myproject_minimal bash -c 'cd /app && bash run install-unix {default_flag}'"
    
    subprocess.run(docker_run_command, shell=True, check=True)

    print("Docker setup complete!")
    print("\nYou can now run your Django server inside the Docker container with:")
    print("docker run -it --rm -p 8000:8000 -v $(pwd):/app myproject_minimal bash -c 'cd /app && python3 manage.py runserver 0.0.0.0:8000'")

def create_dockerfile():
    dockerfile_content = """
FROM debian:bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

CMD ["/bin/bash"]
"""
    with open("Dockerfile", "w") as f:
        f.write(dockerfile_content)
    click.echo("Created minimal Dockerfile.")

@cli.command()
def reset_poetry():
    click.echo("Resetting Poetry environment...")
    try:
        # Remove the virtual environment
        poetry_env_path = subprocess.check_output(["poetry", "env", "info", "--path"], text=True).strip()
        if os.path.exists(poetry_env_path):
            shutil.rmtree(poetry_env_path)
        
        # Remove poetry.lock file
        if os.path.exists("poetry.lock"):
            os.remove("poetry.lock")
        
        # Recreate the environment and install dependencies
        run_command("poetry install")
        click.echo("Poetry environment has been reset.")
    except Exception as e:
        click.echo(f"An error occurred while resetting Poetry environment: {e}", err=True)
        raise

def run_command(command):
    try:
        result = subprocess.run(command, check=True, shell=True, text=True, capture_output=True)
        cleaned_output = '\n'.join(filter(None, (clean_output_line(line) for line in result.stdout.splitlines())))
        click.echo(cleaned_output)
        return cleaned_output
    except subprocess.CalledProcessError as e:
        click.echo(f"Error running command: {command}", err=True)
        click.echo(f"Exit code: {e.returncode}", err=True)
        click.echo(f"Standard output:\n{e.stdout}", err=True)
        click.echo(f"Standard error:\n{e.stderr}", err=True)
        raise

def install_poetry():
    click.echo("Installing Poetry...")
    run_command("curl -sSL https://install.python-poetry.org | python3 -")

def setup_poetry_environment():
    click.echo("Setting up Poetry environment...")
    run_command("poetry install")
    run_command("poetry add python-dotenv")

def install_postgres():
    system = platform.system().lower()
    if system == "linux":
        if os.path.exists("/etc/debian_version"):
            click.echo("Detected Debian/Ubuntu system")
            run_command("apt-get update")
            run_command("apt-get install -y postgresql postgresql-contrib")
        elif os.path.exists("/etc/redhat-release"):
            click.echo("Detected Red Hat/CentOS system")
            run_command("yum install -y postgresql-server postgresql-contrib")
            run_command("postgresql-setup initdb")
            run_command("systemctl start postgresql")
            run_command("systemctl enable postgresql")
    elif system == "darwin":
        click.echo("Detected macOS system")
        run_command("brew install postgresql")
        run_command("brew services start postgresql")
    else:
        click.echo("Unsupported operating system. Please install PostgreSQL manually.", err=True)
        sys.exit(1)

def setup_database(db_name, db_user, db_password):
    commands = [
        f"dropdb --if-exists {db_name}",
        f"createdb {db_name}",
        f"psql -d {db_name} -c \"SELECT 1 FROM pg_roles WHERE rolname='{db_user}'\" | grep -q 1 || psql -d {db_name} -c \"CREATE USER {db_user} WITH PASSWORD '{db_password}';\"",
        f"psql -d {db_name} -c \"ALTER ROLE {db_user} SET client_encoding TO 'utf8';\"",
        f"psql -d {db_name} -c \"ALTER ROLE {db_user} SET default_transaction_isolation TO 'read committed';\"",
        f"psql -d {db_name} -c \"ALTER ROLE {db_user} SET timezone TO 'UTC';\"",
        f"psql -d {db_name} -c \"GRANT ALL PRIVILEGES ON DATABASE {db_name} TO {db_user};\"",
        f"psql -d {db_name} -c \"ALTER USER {db_user} CREATEDB;\""
    ]
    
    for command in commands:
        try:
            output = run_command(command)
            click.echo(f"Command output: {output}")
        except subprocess.CalledProcessError as e:
            if "already exists" not in str(e.stderr):
                raise

def update_env_file(db_name, db_user, db_password):
    env_update_command = f"""
poetry run python -c "
from dotenv import load_dotenv, set_key
import os

env_path = '.env'
load_dotenv(env_path)

env_vars = {{
    'DATABASE_ENGINE': 'django.db.backends.postgresql',
    'DATABASE_NAME': '{db_name}',
    'DATABASE_USER': '{db_user}',
    'DATABASE_PASSWORD': '{db_password}',
    'DATABASE_HOST': 'localhost',
    'DATABASE_PORT': '5432',
}}

for key, value in env_vars.items():
    current_value = os.getenv(key)
    if not current_value:
        set_key(env_path, key, value)
        print(f'Added {{key}} to .env file')
    elif current_value != value:
        set_key(env_path, key, value)
        print(f'Updated {{key}} in .env file')

print('Finished updating .env file with database settings')
"
"""
    run_command(env_update_command)

def run_django_commands():
    run_command("poetry run python manage.py migrate")
    run_command("DJANGO_SUPERUSER_PASSWORD=admin123 poetry run python manage.py createsuperuser --noinput --username admin --email admin@example.com")

@cli.command()
@click.option('--default', is_flag=True, help='Use default database settings')
@click.option('--db-name', help='Database name')
@click.option('--db-user', help='Database user')
@click.option('--db-password', help='Database password', hide_input=True)
def install_unix(default, db_name, db_user, db_password):
    """Install and set up the project on Unix-based systems"""
    click.echo("Welcome to the project setup script!")

    if default:
        db_name = DEFAULT_DB_NAME
        db_user = DEFAULT_DB_USER
        db_password = DEFAULT_DB_PASSWORD
        click.echo("Using default database settings.")
    else:
        if not db_name:
            db_name = click.prompt('Enter the name for your database', default=DEFAULT_DB_NAME)
        if not db_user:
            db_user = click.prompt('Enter the username for your database', default=DEFAULT_DB_USER)
        if not db_password:
            db_password = click.prompt('Enter the password for your database user', default=DEFAULT_DB_PASSWORD, hide_input=True)
    try:
        try:
            subprocess.run(["poetry", "--version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            click.echo("Poetry is already installed.")
        except (subprocess.CalledProcessError, FileNotFoundError):
            click.echo("Poetry is not installed. Installing now...")
            install_poetry()

        # Reset Poetry environment
        click.echo("Setting up Poetry environment...")
        
        # Remove existing virtual environment
        try:
            venv_path = subprocess.check_output(["poetry", "env", "info", "--path"], text=True).strip()
            if os.path.exists(venv_path):
                click.echo(f"Removing existing virtual environment at {venv_path}")
                shutil.rmtree(venv_path)
        except subprocess.CalledProcessError:
            click.echo("No existing virtual environment found.")

        # Remove poetry.lock if it exists
        if os.path.exists("poetry.lock"):
            click.echo("Existing poetry.lock found. Deleting...")
            os.remove("poetry.lock")
        
        click.echo("Creating new virtual environment and installing project dependencies...")
        run_command("poetry install")

        # Check if PostgreSQL is installed
        try:
            subprocess.run(["psql", "--version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            click.echo("PostgreSQL is already installed.")
        except (subprocess.CalledProcessError, FileNotFoundError):
            click.echo("PostgreSQL is not installed. Installing now...")
            install_postgres()
        
        click.echo("Setting up the database...")
        setup_database(db_name, db_user, db_password)
        
        click.echo("Updating .env file...")
        update_env_file(db_name, db_user, db_password)
        
        click.echo("Running Django migrations and creating superuser...")
        run_django_commands()
        
        click.echo("Setup complete!")
        click.echo("\nA superuser has been created with the following credentials:")
        click.echo("Username: admin")
        click.echo("Email: admin@example.com")
        click.echo("Password: admin123")
        click.echo("\nPlease change these credentials immediately after first login.")
        click.echo("\nYou can now run your Django server with:")
        click.echo("poetry run python manage.py runserver")
    except Exception as e:
        click.echo(f"An error occurred during setup: {e}", err=True)
        click.echo("Please check the error message above and try again.", err=True)

if __name__ == "__main__":
    if len(sys.argv) == 1:
        click.echo("Error: No command specified.", err=True)
        click.echo("\nAvailable commands:", err=True)
        ctx = click.Context(cli)
        click.echo(cli.get_help(ctx), err=True)
        sys.exit(1)
    cli()