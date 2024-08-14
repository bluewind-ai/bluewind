#!/bin/bash

# Exit on any error
set -e

poetry install

aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set default.region us-west-2

poetry run cdk bootstrap aws://${AWS_ACCOUNT_ID}/us-west-2

poetry run cdk deploy --require-approval never

echo "CDK deployment completed."