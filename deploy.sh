#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Create a reverse-chronological timestamped log directory
READABLE_TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REVERSE_TIMESTAMP=$(printf '%010d' $((9999999999-$(date +%s))))
LOG_DIR="./logs/${REVERSE_TIMESTAMP}_${READABLE_TIMESTAMP}"
mkdir -p "$LOG_DIR"

run_local_server() {
    echo "Starting local server..."
    if gunicorn --bind :8002 --workers 1 bluewind.wsgi > "$LOG_DIR/local_server.log" 2>&1 & then
        SERVER_PID=$!
        echo $SERVER_PID > "$LOG_DIR/server.pid"
        return 0
    else
        echo "Failed to start local server. Check log file: $LOG_DIR/local_server.log"
        return 1
    fi
}

# Function to run tests locally
run_local_tests() {
    sleep 2

    echo "Running tests locally..."
    if ENVIRONMENT=test TEST_HOST=localhost ALLOWED_HOSTS=localhost, TEST_PORT=8002 python3 manage.py test > "$LOG_DIR/local_tests.log" 2>&1; then
        echo "Local tests completed successfully. Log file: $LOG_DIR/local_tests.log"
        return 0
    else
        echo "Local tests failed. Check log file: $LOG_DIR/local_tests.log"
        return 1
    fi
}

# Function to run tests against staging
run_tests_against_staging() {
    echo "Running tests against staging..."
    if ENVIRONMENT=test TEST_HOST=app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com ALLOWED_HOSTS=app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com, python3 manage.py test > "$LOG_DIR/staging_tests.log" 2>&1; then
        echo "Staging tests completed successfully. Log file: $LOG_DIR/staging_tests.log"
        return 0
    else
        echo "Staging tests failed. Check log file: $LOG_DIR/staging_tests.log"
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
        if [ -f .aws ]; then
            echo "Loading AWS credentials from .aws file"
            source .aws
        else
            echo "Warning: .aws file not found. Using existing environment variables."
        fi
        cd opentf_deploy
        export TF_VAR_aws_access_key_id=$AWS_ACCESS_KEY_ID TF_VAR_aws_secret_access_key=$AWS_SECRET_ACCESS_KEY
        export TF_VAR_app_name=bluewind-app
        tofu init
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

run_local_server &
LOCAL_SERVER_PID=$!
echo "Local Server PID: $LOCAL_SERVER_PID"


run_local_tests &
LOCAL_TESTS_PID=$!

echo "Local Tests PID: $LOCAL_TESTS_PID"


run_tests_against_staging &
STAGING_TESTS_PID=$!

echo "Staging Tests PID : $STAGING_TESTS_PID"

run_docker_tests &
DOCKER_TESTS_PID=$!

echo "Docker Tests PID: $DOCKER_TESTS_PID"

run_opentofu &
OPENTOFU_PID=$!
echo "OpenTofu PID: $OPENTOFU_PID"

# Function to wait for a process with timeout
wait_for_process() {
    local pid=$1
    local timeout=1800  # 30 minutes timeout
    local start_time=$(date +%s)

    while kill -0 $pid 2>/dev/null; do
        if [ $(($(date +%s) - start_time)) -ge $timeout ]; then
            echo "Process $pid timed out after $timeout seconds."
            kill -9 $pid 2>/dev/null
            return 1
        fi
        sleep 5
    done

    wait $pid
    return $?
}

# Wait for local tests to complete
wait_for_process $LOCAL_TESTS_PID
LOCAL_TESTS_STATUS=$?

# Stop the local server after local tests are done, regardless of test result
if [ -f "$LOG_DIR/server.pid" ]; then
    SERVER_PID=$(cat "$LOG_DIR/server.pid")
    kill $SERVER_PID 2>/dev/null
    echo "Local server terminated. Log file: $LOG_DIR/local_server.log"
else
    echo "Server PID file not found. Server may have stopped unexpectedly."
fi

# Wait for other background processes to complete
wait_for_process $STAGING_TESTS_PID
STAGING_TESTS_STATUS=$?

wait_for_process $DOCKER_TESTS_PID
DOCKER_TESTS_STATUS=$?

wait_for_process $OPENTOFU_PID
OPENTOFU_STATUS=$?

# Summary
echo "--- Deployment Summary ---"
[ $LOCAL_TESTS_STATUS -eq 0 ] && echo "Local tests: SUCCESS" || echo "Local tests: FAILED"
[ $STAGING_TESTS_STATUS -eq 0 ] && echo "Staging tests: SUCCESS" || echo "Staging tests: FAILED"
[ $DOCKER_TESTS_STATUS -eq 0 ] && echo "Docker tests: SUCCESS" || echo "Docker tests: FAILED"
[ $OPENTOFU_STATUS -eq 0 ] && echo "OpenTofu apply: SUCCESS" || echo "OpenTofu apply: FAILED"

# Overall status
if [ $LOCAL_TESTS_STATUS -eq 0 ] && [ $STAGING_TESTS_STATUS -eq 0 ] && [ $DOCKER_TESTS_STATUS -eq 0 ] && [ $OPENTOFU_STATUS -eq 0 ]; then
    echo "All processes completed successfully."
    exit 0
else
    echo "One or more processes failed. Check the logs for details."
    exit 1
fi