#!/bin/bash

# Function to run tests locally
run_local_tests() {
    echo "Running tests locally..."
    ENVIRONMENT=test python3 manage.py test
    echo "Local tests completed."
}

# Function to build and run Docker tests
run_docker_tests() {
    echo "Building Docker image..."
    docker build -t my-django-app .

    echo "Running tests in Docker..."
    docker run -e ENVIRONMENT=test \
      -e DEBUG=1 \
      -e SECRET_KEY=your_secret_key_here \
      -e ALLOWED_HOSTS=localhost,127.0.0.1 \
      my-django-app python3 manage.py test
    
    echo "Docker tests completed."
}

# Function to run OpenTofu commands
run_opentofu() {
    cd opentf_deploy
    echo "Logging in to AWS SSO and setting up environment variables..."
    aws sso login --profile ci-cd-admin && 
    eval "$(aws configure export-credentials --profile ci-cd-admin --format env)" && 
    export TF_VAR_aws_access_key_id=$AWS_ACCESS_KEY_ID TF_VAR_aws_secret_access_key=$AWS_SECRET_ACCESS_KEY TF_VAR_aws_session_token=$AWS_SESSION_TOKEN && 
    echo "AWS and Terraform environment variables have been set."

    tofu apply --auto-approve
    echo "OpenTofu apply completed."
}

# Run local tests in background
run_local_tests &
local_pid=$!

# Run Docker tests in background
run_docker_tests &
docker_pid=$!

# Run OpenTofu commands in background
run_opentofu &
opentofu_pid=$!

# Wait for all processes to complete
wait $local_pid
wait $docker_pid
wait $opentofu_pid

echo "All steps completed."