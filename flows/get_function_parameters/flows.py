import inspect
import logging
from typing import List

from django import forms

from files.models import File

logger = logging.getLogger("django.debug")


class GetFunctionParametersForm(forms.Form):
    files = forms.ModelMultipleChoiceField(
        queryset=File.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        help_text="Select the files to include in the template",
    )

    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop("instance", None)
        super().__init__(*args, **kwargs)


import logging

from django import forms
from django.core.exceptions import ValidationError

from files.models import File

logger = logging.getLogger("django.debug")


import logging

from django.db import models

from files.models import File

logger = logging.getLogger("django.debug")

import logging

from files.models import File

logger = logging.getLogger("django.debug")


import logging

from files.models import File

logger = logging.getLogger("django.debug")


import logging

from files.models import File

logger = logging.getLogger("django.debug")


import logging
from typing import get_args, get_origin

from files.models import File

logger = logging.getLogger("django.debug")


import logging

from files.models import File

logger = logging.getLogger("django.debug")


import logging

logger = logging.getLogger("django.debug")

import logging

logger = logging.getLogger("django.debug")

import logging

logger = logging.getLogger("django.debug")
import logging

logger = logging.getLogger("django.debug")
import importlib
import logging

logger = logging.getLogger("django.debug")


def get_function_parameters(files: List[File]) -> List[dict]:
    for file in files:
        try:
            logger.debug(f"Attempting to process file: {file.path}")

            # Extract the module path from the file path
            module_path = (
                file.path.replace("/Users/merwanehamadi/code/bluewind/", "")
                .replace("/", ".")
                .rstrip(".py")
            )

            # Import the module
            module = importlib.import_module(module_path)

            # Find the function named 'get_model_context' in the module
            func = getattr(module, "get_model_context", None)

            if not func or not inspect.isfunction(func):
                logger.warning(
                    f"Function 'get_model_context' not found in module: {module_path}"
                )
                continue

            signature = inspect.signature(func)
            parameters = []

            for name, param in signature.parameters.items():
                param_info = {"name": name}

                # Get the type of the parameter
                param_type = (
                    param.annotation
                    if param.annotation != inspect.Parameter.empty
                    else None
                )

                if param_type is None:
                    logger.warning(
                        f"Parameter '{name}' has no type annotation in module: {module_path}"
                    )
                    continue

                # Check if it's a List
                origin = get_origin(param_type)
                if origin is list or origin is List:
                    param_info["is_list"] = True
                    args = get_args(param_type)
                    if args and len(args) == 1:
                        param_type = args[0]
                    else:
                        logger.warning(
                            f"List parameter '{name}' must have exactly one type argument in module: {module_path}"
                        )
                        continue
                else:
                    param_info["is_list"] = False

                # Check if it's a string (which might represent a model field)
                if isinstance(param_type, str):
                    parts = param_type.split(".")
                    if len(parts) == 2:
                        param_info["model_name"] = parts[0]
                        param_info["field_name"] = parts[1]
                    else:
                        logger.warning(
                            f"Invalid type annotation for parameter '{name}' in module: {module_path}. Expected format: 'model.field'"
                        )
                        continue
                elif inspect.isclass(param_type) and issubclass(
                    param_type, models.Model
                ):
                    param_info["model_name"] = param_type.__name__
                else:
                    logger.warning(
                        f"Parameter '{name}' is not a valid Model type or model field reference in module: {module_path}"
                    )
                    continue

                parameters.append(param_info)

            if parameters:
                logger.debug(f"Parameters found: {parameters}")
                return parameters
            else:
                logger.warning(f"No valid parameters found in module: {module_path}")

        except Exception as e:
            logger.error(
                f"Error processing module {module_path}: {str(e)}", exc_info=True
            )

    # If we've gone through all files and found nothing
    raise ValidationError(
        "No valid function with proper parameters found in any of the provided modules"
    )


# Example usage remains the same
