import importlib
import inspect
import logging

from django import forms

from files.models import File

logger = logging.getLogger("django.temp")


class GetFunctionParametersForm(forms.Form):
    file = forms.ModelChoiceField(queryset=File.objects.all())

    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop("instance", None)
        super().__init__(*args, **kwargs)


def get_function_parameters(file):
    logger.debug(f"Getting function parameters for path: {file.path}")

    # Extract the file name without extension
    file_name = file.path.split("/")[-1].split(".")[0]

    # Construct the module path
    module_path = f"flows.flows.{file_name}"

    logger.debug(f"Attempting to import module: {module_path}")

    try:
        # Dynamically import the module
        module = importlib.import_module(module_path)

        # Get all functions in the module
        functions = inspect.getmembers(module, inspect.isfunction)

        # Assuming we want the parameters of the first function in the module
        if functions:
            func_name, func = functions[0]
            logger.debug(f"Found function: {func_name}")

            # Get the parameters of the function
            parameters = list(inspect.signature(func).parameters.keys())

            logger.debug(f"Parameters found: {parameters}")
            return parameters
        else:
            logger.debug("No functions found in the module")
            return []
    except ImportError:
        logger.error(f"ImportError: Could not import module {module_path}")
        return []
    except Exception as e:
        logger.error(f"Error in get_function_parameters: {str(e)}")
        return []
