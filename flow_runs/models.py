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
        # Log before saving the main object
        logger.debug(f"FlowRun object state before save: {obj.__dict__}")
        super().save_model(request, obj, form, change)
        # Log after saving the main object
        logger.debug(f"FlowRun object state after save: {obj.__dict__}")

    def save_related(self, request, form, formsets, change):
        # Save the inlines
        super().save_related(request, form, formsets, change)
        obj = form.instance

        # Now the inlines are saved; you can access them
        flow_run_arguments = obj.arguments.all()
        logger.debug(f"FlowRun has {flow_run_arguments.count()} arguments.")

        # Perform validation
        if not any(arg.contenttype for arg in flow_run_arguments):
            logger.error("ContentType is required for at least one FlowRunArgument.")
            raise ValidationError(
                "ContentType is required for at least one FlowRunArgument."
            )

        # Additional processing
        logger.debug(f"FlowRun object after saving related objects: {obj.__dict__}")
        for arg in flow_run_arguments:
            logger.debug(f"FlowRunArgument: {arg} with ContentType: {arg.contenttype}")
