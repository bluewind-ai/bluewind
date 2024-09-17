import importlib
import inspect
import logging
from typing import List

from django import forms

from files.models import File

logger = logging.getLogger("django.temp")


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

logger = logging.getLogger("django.temp")


import logging

from django.db import models

from files.models import File

logger = logging.getLogger("django.temp")

import logging

from files.models import File

logger = logging.getLogger("django.temp")


import logging

from files.models import File

logger = logging.getLogger("django.temp")


import logging

from files.models import File

logger = logging.getLogger("django.temp")


import logging
from typing import get_args, get_origin

from files.models import File

logger = logging.getLogger("django.temp")


import logging

from files.models import File

logger = logging.getLogger("django.temp")


def get_function_parameters(files: List[File]) -> List[dict]:
    for file in files:
        logger.debug(f"Getting function parameters for path: {file.path}")

        file_name = file.path.split("/")[-1].split(".")[0]
        module_path = f"flows.flows.{file_name}"

        logger.debug(f"Attempting to import module: {module_path}")

        try:
            module = importlib.import_module(module_path)

            # Look for a function with the same name as the file
            func = getattr(module, file_name, None)
            if func is None:
                # If not found, look for any function in the module
                functions = inspect.getmembers(module, inspect.isfunction)
                if functions:
                    _, func = functions[0]
                else:
                    raise ValidationError(f"No functions found in module {module_path}")

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
                    raise ValidationError(f"Parameter '{name}' has no type annotation")

                # Check if it's a List
                origin = get_origin(param_type)
                if origin is list or origin is List:
                    param_info["is_list"] = True
                    args = get_args(param_type)
                    if args and len(args) == 1:
                        param_type = args[0]
                    else:
                        raise ValidationError(
                            f"List parameter '{name}' must have exactly one type argument"
                        )
                else:
                    param_info["is_list"] = False

                # Check if it's a Django model
                if inspect.isclass(param_type) and issubclass(param_type, models.Model):
                    param_info["model_name"] = param_type.__name__
                else:
                    raise ValidationError(f"Parameter '{name}' is not a Model type")

                parameters.append(param_info)

            logger.debug(f"Parameters found: {parameters}")
            return parameters

        except ImportError:
            logger.error(f"ImportError: Could not import module {module_path}")
            raise
        except Exception as e:
            logger.error(f"Error in get_function_parameters: {str(e)}")
            raise

    raise ValidationError("No valid flow function found in any of the provided files")
