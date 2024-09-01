import subprocess
from django.core.management.base import BaseCommand
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

class Command(BaseCommand):
    help = 'Sets up the PostgreSQL database for the project'

    def add_arguments(self, parser):
        parser.add_argument('--password', type=str, help='Password for the new database user')

    def handle(self, *args, **options):
        db_name = 'bluewind'
        db_user = 'bluewind_user'
        db_password = options['password']

        # Connect to PostgreSQL
        conn = psycopg2.connect(dbname='postgres', user='postgres', host='localhost', password='postgres')
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Create database
        try:
            cur.execute(f"CREATE DATABASE {db_name}")
            self.stdout.write(self.style.SUCCESS(f"Database '{db_name}' created successfully"))
        except psycopg2.errors.DuplicateDatabase:
            self.stdout.write(self.style.WARNING(f"Database '{db_name}' already exists"))

        # Create user
        try:
            cur.execute(f"CREATE USER {db_user} WITH PASSWORD '{db_password}'")
            self.stdout.write(self.style.SUCCESS(f"User '{db_user}' created successfully"))
        except psycopg2.errors.DuplicateObject:
            self.stdout.write(self.style.WARNING(f"User '{db_user}' already exists"))

        # Grant privileges
        cur.execute(f"ALTER USER {db_user} CREATEDB")
        cur.execute(f"GRANT ALL PRIVILEGES ON DATABASE {db_name} TO {db_user}")
        self.stdout.write(self.style.SUCCESS("Privileges granted successfully"))

        # Close PostgreSQL connection
        cur.close()
        conn.close()

        # Update .env file
        with open('.env', 'w') as f:
            f.write(f"DATABASE_URL=postgresql://{db_user}:{db_password}@localhost:5432/{db_name}")
        self.stdout.write(self.style.SUCCESS(".env file updated successfully"))

        # Run migrations
        self.stdout.write("Running migrations...")
        subprocess.run(["python", "manage.py", "makemigrations"])
        subprocess.run(["python", "manage.py", "migrate"])

        self.stdout.write(self.style.SUCCESS("Database setup completed successfully"))