import os
import sys
import subprocess
import platform
from getpass import getpass
import getpass as gp
import json

# Default values
DEFAULT_DB_NAME = "myproject_db"
DEFAULT_DB_USER = "myproject_user"
DEFAULT_DB_PASSWORD = "myproject_password"

def run_command(command):
    try:
        result = subprocess.run(command, check=True, shell=True, text=True, capture_output=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        print(f"Command output: {e.stderr}")
        raise

def activate_poetry_env():
    env_path = get_poetry_env()
    # Modify PATH
    os.environ['PATH'] = f"{os.path.join(env_path, 'bin')}:{os.environ['PATH']}"
    # Modify VIRTUAL_ENV
    os.environ['VIRTUAL_ENV'] = env_path
    # Remove PYTHONHOME if it's set
    os.environ.pop('PYTHONHOME', None)

def run_django_commands():
    activate_poetry_env()
    subprocess.run(["python", "manage.py", "migrate"], check=True)
    subprocess.run([
        "python", "manage.py", "createsuperuser",
        "--noinput",
        "--username", "admin",
        "--email", "admin@example.com"
    ], env={**os.environ, 'DJANGO_SUPERUSER_PASSWORD': 'admin123'}, check=True)

def get_current_user():
    return gp.getuser()

def activate_poetry_shell():
    poetry_env = subprocess.check_output(["poetry", "env", "info", "--path"], text=True).strip()
    activate_this = os.path.join(poetry_env, 'bin', 'activate_this.py')
    exec(open(activate_this).read(), {'__file__': activate_this})

def install_postgres():
    system = platform.system().lower()
    if system == "linux":
        if os.path.exists("/etc/debian_version"):
            print("Detected Debian/Ubuntu system")
            run_command("sudo apt-get update")
            run_command("sudo apt-get install -y postgresql postgresql-contrib")
        elif os.path.exists("/etc/redhat-release"):
            print("Detected Red Hat/CentOS system")
            run_command("sudo yum install -y postgresql-server postgresql-contrib")
            run_command("sudo postgresql-setup initdb")
            run_command("sudo systemctl start postgresql")
            run_command("sudo systemctl enable postgresql")
    elif system == "darwin":
        print("Detected macOS system")
        run_command("brew install postgresql")
        run_command("brew services start postgresql")
    else:
        print("Unsupported operating system. Please install PostgreSQL manually.")
        sys.exit(1)

def setup_database(db_name, db_user, db_password):
    current_user = get_current_user()
    commands = [
        f"dropdb --if-exists {db_name}",
        f"createdb {db_name}",
        f"psql -d {db_name} -c \"SELECT 1 FROM pg_roles WHERE rolname='{db_user}'\" | grep -q 1 || psql -d {db_name} -c \"CREATE USER {db_user} WITH PASSWORD '{db_password}';\"",
        f"psql -d {db_name} -c \"ALTER ROLE {db_user} SET client_encoding TO 'utf8';\"",
        f"psql -d {db_name} -c \"ALTER ROLE {db_user} SET default_transaction_isolation TO 'read committed';\"",
        f"psql -d {db_name} -c \"ALTER ROLE {db_user} SET timezone TO 'UTC';\"",
        f"psql -d {db_name} -c \"GRANT ALL PRIVILEGES ON DATABASE {db_name} TO {db_user};\""
        f"psql -d {db_name} -c \"ALTER USER {db_user} CREATEDB;\""
    ]
    
    for command in commands:
        try:
            output = run_command(command)
            print(f"Command output: {output}")
        except subprocess.CalledProcessError as e:
            print(f"Error running command: {e}")
            print(f"Command output: {e.stderr}")
            if "already exists" not in str(e.stderr):
                raise

def update_env_file(db_name, db_user, db_password):
    env_path = '.env'
    
    # Load existing environment variables
    load_dotenv(env_path)
    
    # Define the variables we want to set/update
    env_vars = {
        "DATABASE_ENGINE": "django.db.backends.postgresql",
        "DATABASE_NAME": db_name,
        "DATABASE_USER": db_user,
        "DATABASE_PASSWORD": db_password,
        "DATABASE_HOST": "localhost",
        "DATABASE_PORT": "5432",
    }
    
    # Update or add each variable
    for key, value in env_vars.items():
        current_value = os.getenv(key)
        if not current_value:
            set_key(env_path, key, value)
            print(f"Added {key} to .env file")
        elif current_value != value:
            set_key(env_path, key, value)
            print(f"Updated {key} in .env file")
    
    print("Finished updating .env file with database settings")

def install_poetry():
    print("Installing Poetry...")
    run_command("curl -sSL https://install.python-poetry.org | python3 -")

def setup_poetry_environment():
    print("Setting up Poetry environment...")
    run_command("poetry install")
    # Add python-dotenv to the project
    run_command("poetry add python-dotenv")

def update_env_file(db_name, db_user, db_password):
    # We'll use subprocess to run this function within the Poetry environment
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

def get_poetry_env():
    result = subprocess.run(["poetry", "env", "info", "--json"], capture_output=True, text=True)
    env_info = json.loads(result.stdout)
    return env_info['path']

def get_input_with_default(prompt, default):
    user_input = input(f"{prompt} (default: {default}): ").strip()
    return user_input if user_input else default

def get_password_with_default(prompt, default):
    user_input = getpass(f"{prompt} (leave empty for default): ").strip()
    return user_input if user_input else default

def main():
    print("Welcome to the project setup script!")

    try:
        # Install Poetry if not already installed
        try:
            subprocess.run(["poetry", "--version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("Poetry is already installed.")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Poetry is not installed. Installing now...")
            install_poetry()

        # Setup Poetry environment
        setup_poetry_environment()

        # Check if PostgreSQL is installed
        try:
            subprocess.run(["psql", "--version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("PostgreSQL is already installed.")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("PostgreSQL is not installed. Installing now...")
            install_postgres()
        
        # Database setup
        db_name = get_input_with_default("Enter the name for your database", DEFAULT_DB_NAME)
        db_user = get_input_with_default("Enter the username for your database", DEFAULT_DB_USER)
        db_password = get_password_with_default("Enter the password for your database user", DEFAULT_DB_PASSWORD)
        
        print("Setting up the database...")
        setup_database(db_name, db_user, db_password)
        
        print("Updating .env file...")
        update_env_file(db_name, db_user, db_password)
        
        print("Running Django migrations and creating superuser...")
        run_django_commands()
        
        print("Setup complete!")
        print("\nA superuser has been created with the following credentials:")
        print("Username: admin")
        print("Email: admin@example.com")
        print("Password: admin123")
        print("\nPlease change these credentials immediately after first login.")
        print("\nYou can now run your Django server with:")
        print("python manage.py runserver")
    except Exception as e:
        print(f"An error occurred during setup: {e}")
        print("Please check the error message above and try again.")

if __name__ == "__main__":
    main()