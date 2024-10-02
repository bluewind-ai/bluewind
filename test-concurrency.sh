#!/bin/bash

# Function to make a single request
make_request() {
    local id=$1
    local start_time=$(date +%s.%N)
    local response=$(curl -s -w "\n%{http_code}" "http://127.0.0.1:8000/workspaces/1/accounts/login/")
    local end_time=$(date +%s.%N)
    local body=$(echo "$response" | sed '$d' | tr -d '\n' | cut -c1-50) # Truncate body to first 50 characters
    local status_code=$(echo "$response" | tail -n1)
    local duration=$(echo "$end_time - $start_time" | bc)
    printf "Request %2d: Status Code: %s, Body (first 50 chars): %s..., Time: %.3f seconds\n" $id $status_code "$body" $duration
}

# Array to store background process PIDs
pids=()

# Make 20 concurrent requests
for i in {1..10000}; do
    make_request $i &
    pids+=($!)
done

# Wait for all background processes to finish
for pid in "${pids[@]}"; do
    wait $pid
done

echo "All requests completed."
