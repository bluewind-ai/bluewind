#!/bin/bash

# Function to deactivate any active virtual environment
# deactivate_env() {
#     if [ -n "$VIRTUAL_ENV" ]; then
#         deactivate
#     fi
#     if [ -n "$POETRY_ACTIVE" ]; then
#         exit
#     fi
# }

# # Deactivate any active environment
# deactivate_env

# Run the Python setup script
python setup_project.py

# # Check if the Python script executed successfully
# if [ $? -eq 0 ]; then
#     echo "Setup completed successfully. Activating Poetry shell..."
#     # Activate the Poetry shell
#     eval "$(poetry env use python)"
# else
#     echo "Setup failed. Please check the error messages above."
# fi