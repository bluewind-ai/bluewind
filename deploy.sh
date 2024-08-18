#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Create a reverse-chronological timestamped log directory
READABLE_TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REVERSE_TIMESTAMP=$(printf '%010d' $((9999999999-$(date +%s))))
LOG_DIR="./logs/${REVERSE_TIMESTAMP}_${READABLE_TIMESTAMP}"
mkdir -p "$LOG_DIR"

# Function to run tests locally
run_local_tests() {
    echo "Running tests locally..."
    if ENVIRONMENT=test python3 manage.py test > "$LOG_DIR/local_tests.log" 2>&1; then
        echo "Local tests completed successfully. Log file: $LOG_DIR/local_tests.log"
        return 0
    else
        echo "Local tests failed. Check log file: $LOG_DIR/local_tests.log"
        return 1
    fi
}

# Function to build and run Docker tests
run_docker_tests() {
    echo "Building Docker image and running tests..."
    if (
        docker build -t my-django-app .
        docker run -e ENVIRONMENT=test \
          -e DEBUG=1 \
          -e SECRET_KEY=your_secret_key_here \
          -e ALLOWED_HOSTS=localhost,127.0.0.1 \
          -e CSRF_TRUSTED_ORIGINS=http://localhost,http://127.0.0.1 \
          my-django-app python3 manage.py test
    ) > "$LOG_DIR/docker_tests.log" 2>&1; then
        echo "Docker tests completed successfully. Log file: $LOG_DIR/docker_tests.log"
        return 0
    else
        echo "Docker tests failed. Check log file: $LOG_DIR/docker_tests.log"
        return 1
    fi
}

# Function to run OpenTofu commands
run_opentofu() {
    echo "Running OpenTofu commands..."
    if (
        cd opentf_deploy
        aws sso login --profile ci-cd-admin
        eval "$(aws configure export-credentials --profile ci-cd-admin --format env)"
        export TF_VAR_aws_access_key_id=$AWS_ACCESS_KEY_ID TF_VAR_aws_secret_access_key=$AWS_SECRET_ACCESS_KEY TF_VAR_aws_session_token=$AWS_SESSION_TOKEN
        tofu apply --auto-approve
    ) > "$LOG_DIR/opentofu.log" 2>&1; then
        echo "OpenTofu apply completed successfully. Log file: $LOG_DIR/opentofu.log"
        return 0
    else
        echo "OpenTofu apply failed. Check log file: $LOG_DIR/opentofu.log"
        return 1
    fi
}

# Run all processes in parallel
echo "Starting all processes..."

run_local_tests &
LOCAL_TESTS_PID=$!

run_docker_tests &
DOCKER_TESTS_PID=$!

run_opentofu &
OPENTOFU_PID=$!

# Wait for all background processes to complete
wait $LOCAL_TESTS_PID
LOCAL_TESTS_STATUS=$?

wait $DOCKER_TESTS_PID
DOCKER_TESTS_STATUS=$?

wait $OPENTOFU_PID
OPENTOFU_STATUS=$?

# Summary
echo "--- Deployment Summary ---"
[ $LOCAL_TESTS_STATUS -eq 0 ] && echo "Local tests: SUCCESS" || echo "Local tests: FAILED"
[ $DOCKER_TESTS_STATUS -eq 0 ] && echo "Docker tests: SUCCESS" || echo "Docker tests: FAILED"
[ $OPENTOFU_STATUS -eq 0 ] && echo "OpenTofu apply: SUCCESS" || echo "OpenTofu apply: FAILED"

# Overall status
if [ $LOCAL_TESTS_STATUS -eq 0 ] && [ $DOCKER_TESTS_STATUS -eq 0 ] && [ $OPENTOFU_STATUS -eq 0 ]; then
    echo "All processes completed successfully."
    exit 0
else
    echo "One or more processes failed. Check the logs for details."
    exit 1
fi