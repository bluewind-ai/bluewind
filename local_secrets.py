# import json
# import os

# import boto3
# from botocore.exceptions import ClientError
# from dotenv import load_dotenv


# def get_secrets_manager_client():
#     load_dotenv()
#     env = os.environ.copy()
#     if os.path.exists(".aws"):
#         with open(".aws", "r") as f:
#             for line in f:
#                 if "=" in line:
#                     key, value = line.strip().split("=", 1)
#                     env[key] = value

#     return boto3.client(
#         "secretsmanager",
#         aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
#         aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
#         region_name="us-west-2",
#     )


# def secret_exists(client, secret_name):
#     try:
#         client.describe_secret(SecretId=secret_name)
#         return True
#     except client.exceptions.ResourceNotFoundException:
#         return False


# def load_secret_to_env(secret_name, env_file=".env"):
#     client = get_secrets_manager_client()

#     if not secret_exists(client, secret_name):
#         logger.debug(f"Secret '{secret_name}' does not exist.")
#         return False

#     try:
#         # Get the current secret value
#         get_secret_value_response = client.get_secret_value(SecretId=secret_name)
#         secret = json.loads(get_secret_value_response["SecretString"])

#         # Write to file and set environment variables
#         with open(env_file, "w") as f:
#             for key, value in secret.items():
#                 os.environ[key] = str(value)
#                 f.write(f"{key}={value}\n")

#         # Dump the list of environment variable keys to JSON
#         env_keys = list(secret.keys())
#         with open("env_list.json", "w") as f:
#             json.dump(env_keys, f, indent=2)

#         logger.debug(f"Secret loaded and written to {env_file}.")
#         logger.debug("Environment variable keys dumped to env_list.json.")
#         return True

#     except ClientError as e:
#         logger.debug(f"Error retrieving secret: {e}")
#     except json.JSONDecodeError:
#         logger.debug("Error decoding secret JSON.")
#     except Exception as e:
#         logger.debug(f"Unexpected error: {e}")

#     return False


# if __name__ == "__main__":
#     secret_name = "prod-env"
#     load_secret_to_env(secret_name)
