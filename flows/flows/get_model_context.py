import logging
import os

from django.apps import apps
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger("django.temp")


def get_model_context(workspace, content_type_id):
    try:
        # Get the ContentType object
        content_type = ContentType.objects.get(id=content_type_id)

        # Get the model class
        model_class = content_type.model_class()

        # Get the app label and model name
        app_label = model_class._meta.app_label
        model_name = model_class._meta.model_name

        # Construct the path to the models.py file
        app_config = apps.get_app_config(app_label)
        models_path = os.path.join(app_config.path, "models.py")

        # Read the content of the models.py file
        with open(models_path, "r") as file:
            result = file.read()

        return result

    except ContentType.DoesNotExist:
        logger.error(f"ContentType with id {content_type_id} does not exist")
        return None
    except FileNotFoundError:
        logger.error(f"models.py file not found for app {app_label}")
        return None
    except Exception as e:
        logger.error(f"Error in get_model_context: {str(e)}")
        return None
