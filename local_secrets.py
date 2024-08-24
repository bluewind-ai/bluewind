import os
import boto3
import json
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import __main__
import __main__

def load_secrets_to_env(secret_name):
    load_dotenv()
    env = os.environ.copy()
    if os.path.exists('.aws'):
        with open('.aws', 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    env[key] = value
    # Initialize the Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        service_name='secretsmanager',
        region_name='us-west-2'  # replace with your AWS region
    )

    # secret_name = "test-env"  # The name of your secret in AWS Secrets Manager

    try:
        # Fetch the secret
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        secret = json.loads(get_secret_value_response['SecretString'])

        # Set each secret as an environment variable
        for key, value in secret.items():
            os.environ[key] = str(value)

        print("Secrets loaded successfully into environment variables.")

    except ClientError as e:
        print(f"Error fetching secrets: {e}")
        raise e
    except json.JSONDecodeError:
        print("Error decoding secret JSON.")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise

def create_or_update_secret(secret_name, secret_value):
    load_dotenv()
    env = os.environ.copy()
    if os.path.exists('.aws'):
        with open('.aws', 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    env[key] = value
    
    secretsmanager_client = boto3.client('secretsmanager',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )

    try:
        secretsmanager_client.create_secret(
            Name=secret_name,
            Description='Secret created by script',
            SecretString=json.dumps(secret_value)
        )
        print(f"Secret '{secret_name}' created successfully")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceExistsException':
            print(f"Secret '{secret_name}' already exists. Updating...")
            try:
                secretsmanager_client.put_secret_value(
                    SecretId=secret_name,
                    SecretString=json.dumps(secret_value)
                )
                print(f"Secret '{secret_name}' updated successfully")
            except ClientError as e:
                print(f"Error updating secret '{secret_name}': {e}")
        else:
            print(f"Error creating secret '{secret_name}': {e}")

# Your secrets
secrets = {
    "SECRET_KEY": "your_secret_key_here",
    "DEBUG": "True",
    "ALLOWED_HOSTS": "*",
    "DB_USERNAME": "todo",
    "DB_PASSWORD": "todo",
    "DB_HOST": "todo",
    "DB_PORT": "6543",
    "DB_NAME": "postgres",
    "DJANGO_SUPERUSER_EMAIL": "admin@example.com",
    "DJANGO_SUPERUSER_USERNAME": "admin@example.com",
    "DJANGO_SUPERUSER_PASSWORD": "admin123",
    "CSRF_TRUSTED_ORIGINS": "",
    "GOOGLE_OAUTH_CLIENT_ID": "your_google_client_id",
    "GOOGLE_OAUTH_CLIENT_SECRET": "your_google_client_secret",
    "GMAIL_CLIENT_SECRET_FILE": "google_api_secrets.json",
    "TEST_HOST": "localhost",
    "BASE_URL": "http://localhost:8000"
}

# Remove empty values
secrets = {k: v for k, v in secrets.items() if v}

# Create or update the secret
  # Change this to your desired secret name
if __main__ == "__main__":
    secret_name = "test-env"
    create_or_update_secret(secret_name, secrets)