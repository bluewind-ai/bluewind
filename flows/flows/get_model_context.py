# flows/flows/get_model_context.py
import logging
import os

from django import forms
from django.apps import apps
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger("django.not_used")


class GetModelContextForm(forms.Form):
    content_type = forms.ModelChoiceField(queryset=ContentType.objects.all())

    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop("instance", None)
        super().__init__(*args, **kwargs)


def get_model_context(content_type):
    try:
        if not isinstance(content_type, ContentType):
            raise ValueError("content_type must be a ContentType instance")

        # Get the model class
        model_class = content_type.model_class()

        if not model_class:
            raise ValueError(f"No model found for ContentType: {content_type}")

        # Get the app label
        app_label = model_class._meta.app_label

        # Construct the path to the models.py file
        app_config = apps.get_app_config(app_label)
        models_path = os.path.join(app_config.path, "models.py")

        # Read the content of the models.py file
        with open(models_path, "r") as file:
            result = file.read()

        return result

    except Exception as e:
        logger.error(f"Error in get_model_context: {str(e)}")
        return f"Error: {str(e)}"
