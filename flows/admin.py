import logging

from django.contrib import admin
from django.contrib.contenttypes.models import ContentType
from django.forms import ValidationError

from base_model_admin.admin import InWorkspace

from .models import FlowRunArgument

logger = logging.getLogger("django.temp")


class FlowRunArgumentInline(admin.TabularInline):
    model = FlowRunArgument
    extra = 1

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "contenttype":
            kwargs["queryset"] = ContentType.objects.all().order_by("model")
        logger.debug(f"Formfield for {db_field.name} in FlowRunArgumentInline")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            logger.debug(
                f"Saving FlowRunArgument: {instance} with contenttype {instance.contenttype}"
            )
            instance.save()
        formset.save_m2m()


class FlowRunAdmin(InWorkspace):
    inlines = [FlowRunArgumentInline]

    def save_model(self, request, obj, form, change):
        # Log whether the form submission is for a new or existing instance
        logger.debug(
            f"Saving FlowRun: {'Updating existing instance' if change else 'Creating new instance'}"
        )

        # Log the entire form data to understand what is being submitted
        logger.debug(f"Form data submitted: {form.cleaned_data}")

        # Log the state of the object before saving
        logger.debug(f"FlowRun object state before save: {obj.__dict__}")

        # Check if any related FlowRunArguments have a ContentType and log details
        flow_run_arguments = obj.flowrunargument_set.all()
        if not any(arg.contenttype for arg in flow_run_arguments):
            logger.error("ContentType is required for at least one FlowRunArgument.")
            raise ValidationError(
                "ContentType is required for at least one FlowRunArgument."
            )

        # Log information about the related FlowRunArguments
        for arg in flow_run_arguments:
            logger.debug(f"FlowRunArgument: {arg} with ContentType: {arg.contenttype}")

        # Proceed to save the model
        super().save_model(request, obj, form, change)

        # Log the state of the object after saving
        logger.debug(f"FlowRun object state after save: {obj.__dict__}")
