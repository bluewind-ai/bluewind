import logging

from django import forms
from django.apps import apps
from django.contrib import admin
from django.contrib.admin.helpers import AdminForm
from django.core.exceptions import ImproperlyConfigured
from forms.models import Form

from workspaces.models import Workspace

logger = logging.getLogger(__name__)


def register_forms():
    default_workspace = (
        Workspace.objects.first()
    )  # Or however you want to determine the default workspace
    registered_forms = set(Form.objects.values_list("name", flat=True))

    def register_form(name, form_class):
        if name not in registered_forms:
            Form.objects.create(name=name, workspace=default_workspace)
            logger.debug(f"Registered new form: {name}")

    # Register forms from django.forms
    for name, obj in forms.__dict__.items():
        if (
            isinstance(obj, type)
            and issubclass(obj, forms.BaseForm)
            and obj != forms.BaseForm
        ):
            register_form(name, obj)

    # Register admin-related forms
    admin_forms = [
        admin.helpers.ActionForm,
        AdminForm,
        admin.widgets.AdminDateWidget,
        admin.widgets.AdminSplitDateTime,
        admin.widgets.AdminRadioSelect,
        admin.widgets.AdminFileWidget,
    ]
    for form in admin_forms:
        register_form(form.__name__, form)

    # Check all installed apps for custom forms
    for app_config in apps.get_app_configs():
        # Check forms.py
        try:
            forms_module = __import__(f"{app_config.name}.forms", fromlist=[""])
            for name, obj in forms_module.__dict__.items():
                if (
                    isinstance(obj, type)
                    and issubclass(obj, forms.BaseForm)
                    and obj != forms.BaseForm
                ):
                    register_form(name, obj)
        except ImportError:
            pass

        # Check admin.py for ModelForms
        try:
            admin_module = __import__(f"{app_config.name}.admin", fromlist=[""])
            for name, obj in admin_module.__dict__.items():
                if isinstance(obj, type) and issubclass(obj, admin.ModelAdmin):
                    if hasattr(obj, "name") and obj.form != forms.ModelForm:
                        register_form(obj.form.__name__, obj.form)
        except ImportError:
            pass

    # Register ModelForms for all models
    for model in apps.get_models():
        try:
            # Try to create a ModelForm with all fields
            model_form_class = forms.modelform_factory(model, fields="__all__")
            register_form(f"{model.__name__}ModelForm", model_form_class)
        except ImproperlyConfigured:
            # If that fails, try with no fields
            try:
                model_form_class = forms.modelform_factory(model, fields=[])
                register_form(f"{model.__name__}ModelForm", model_form_class)
            except BaseException:
                logger.debug(f"Could not create ModelForm for {model.__name__}")
