import json
import logging

from django.apps import apps
from django.contrib import admin

# please import transaction
from django.db import models, transaction
from django.utils.safestring import mark_safe
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class Flow(WorkspaceRelated):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class FlowAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at", "updated_at"]
    search_fields = ["name", "description"]


class FlowRun(WorkspaceRelated):
    class Status(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not Started"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"

    flow = models.ForeignKey("Flow", on_delete=models.CASCADE, related_name="runs")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NOT_STARTED
    )
    state = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Run of {self.flow.name} at {self.created_at}"

    def save(self, *args, **kwargs):
        if not self.pk:  # If this is a new FlowRun
            self.state = {
                "channel_name": f"Channel for Flow {self.flow.name}",
                "channel_description": f"Automatically created channel for Flow {self.flow.name}",
            }
        super().save(*args, **kwargs)

    @property
    def general_info(self):
        try:
            step_runs = (
                self.step_runs.all()
                .order_by("id")
                .select_related("flow_step", "flow_step__model")
            )

            step_runs_info = [
                {
                    "id": step_run.id,
                    "action_type": step_run.flow_step.get_action_type_display(),
                    "model": step_run.flow_step.model.name,
                    "is_completed": True,
                    "created_at": step_run.created_at.isoformat(),
                }
                for step_run in step_runs
            ]

            return {
                "id": self.id,
                "flow_name": self.flow.name,
                "flow_id": self.flow.id,
                "workspace_id": self.workspace_id,
                "created_at": self.created_at.isoformat(),
                "updated_at": self.updated_at.isoformat(),
                "total_steps": self.flow.steps.count(),
                "completed_steps": step_runs.count(),
                "status": self.get_status_display(),
                "step_runs": step_runs_info,
            }
        except Exception as e:
            return {"error": str(e)}

    def get_status(self):
        total_steps = self.flow.steps.count()
        completed_steps = self.step_runs.count()
        if completed_steps == 0:
            return self.Status.NOT_STARTED
        elif completed_steps == total_steps:
            return self.Status.COMPLETED
        else:
            return self.Status.IN_PROGRESS

    def update_status(self):
        total_steps = self.flow.steps.count()
        completed_steps = self.step_runs.count()
        if completed_steps == 0:
            new_status = self.Status.NOT_STARTED
        elif completed_steps == total_steps:
            new_status = self.Status.COMPLETED
        else:
            new_status = self.Status.IN_PROGRESS

        if self.status != new_status:
            self.status = new_status
            self.save(update_fields=["status"])


from django.db import models


class FlowRunAdmin(admin.ModelAdmin):
    list_display = ["id", "flow", "workspace", "created_at", "updated_at", "status"]
    fields = [
        "flow",
        "workspace",
        "status",
        "created_at",
        "updated_at",
        "get_general_info",
    ]
    readonly_fields = ["get_general_info", "created_at", "updated_at"]

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        logger.debug(f"Entering changeform_view for object_id: {object_id}")

        extra_context = extra_context or {}

        # Get the form
        form_class = self.get_form(request, object_id)
        initial_data = self.get_changeform_initial_data(request)
        form = form_class(initial=initial_data)

        logger.debug(f"Form class: {form_class.__name__}")
        logger.debug(f"Initial form data: {initial_data}")

        # Attempt to serialize the entire form
        form_data = {
            "fields": {},
            "initial": form.initial,
            "data": form.data,
            "errors": form.errors,
        }

        for name, field in form.fields.items():
            form_data["fields"][name] = {
                "label": field.label,
                "help_text": field.help_text,
                "required": field.required,
                "widget": str(field.widget.__class__.__name__),
            }
            if hasattr(field, "choices"):
                form_data["fields"][name]["choices"] = [
                    {"value": str(choice[0]), "display": str(choice[1])}
                    for choice in field.choices
                ]

        try:
            json_data = json.dumps(form_data, cls=CustomJSONEncoder, indent=2)
            logger.debug(f"Serialized form data:\n{json_data}")
        except Exception as e:
            logger.error(f"Error serializing form data to JSON: {str(e)}")
            json_data = json.dumps({})

        extra_context["initial_json"] = json_data

        logger.debug("Calling super().changeform_view")
        return super().changeform_view(request, object_id, form_url, extra_context)

    def get_general_info(self, obj):
        info = obj.general_info
        formatted_json = json.dumps(info, indent=2)
        return format_html(
            '<pre style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">{}</pre>',
            mark_safe(formatted_json),
        )

    get_general_info.short_description = "General Info"
    get_general_info.short_description = "General Info"

    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        return True


class Model(WorkspaceRelated):
    name = models.CharField(max_length=100)
    app_label = models.CharField(max_length=100)
    workspace = models.ForeignKey(
        "workspaces.Workspace", on_delete=models.CASCADE, null=True
    )

    class Meta:
        unique_together = ("app_label", "name")
        ordering = ["app_label", "name"]

    def __str__(self):
        return self.name

    @property
    def full_name(self):
        return f"{self.app_label}.{self.name}"

    @classmethod
    def insert_all_models(cls):
        from workspaces.models import Workspace  # Import here to avoid circular imports

        try:
            with transaction.atomic():
                # Get or create a default workspace
                default_workspace, _ = Workspace.objects.get_or_create(
                    name="Default Workspace"
                )

                models_to_create = []
                for app_config in apps.get_app_configs():
                    for model in app_config.get_models():
                        model_instance = cls(
                            name=model._meta.model_name,
                            app_label=model._meta.app_label,
                            workspace=default_workspace,
                        )
                        models_to_create.append(model_instance)
                        print(f"Preparing to insert: {model_instance.full_name}")

                created = cls.objects.bulk_create(
                    models_to_create, ignore_conflicts=True
                )
                print(f"Successfully inserted {len(created)} models")
                return len(created)
        except Exception as e:
            print(f"Error inserting models: {e}")
            import traceback

            traceback.print_exc()
            return 0


from django.db import models
from workspaces.models import WorkspaceRelated


class FlowStep(WorkspaceRelated):
    class ActionType(models.TextChoices):
        CREATE = "CREATE", "Create"
        SAVE = "SAVE", "Save"
        DELETE = "DELETE", "Delete"
        ACTION = "ACTION", "Action"
        SELECT = "SELECT", "Select"

    flow = models.ForeignKey("Flow", on_delete=models.CASCADE, related_name="steps")
    action_type = models.CharField(
        max_length=10, choices=ActionType.choices, default=ActionType.ACTION
    )
    model = models.ForeignKey("Model", on_delete=models.PROTECT)

    def __str__(self):
        return (
            f"{self.flow.name} - {self.get_action_type_display()} on {self.model.name}"
        )


class FlowStepInline(admin.TabularInline):
    model = FlowStep
    fk_name = "parent"
    extra = 1


from django.db import models


class StepRun(WorkspaceRelated):
    flow_run = models.ForeignKey(
        FlowRun, on_delete=models.CASCADE, related_name="step_runs"
    )
    flow_step = models.ForeignKey(
        FlowStep,
        on_delete=models.CASCADE,
        related_name="step_runs",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    input_data = models.JSONField(default=dict, blank=True)
    result = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING", "Pending"),
            ("IN_PROGRESS", "In Progress"),
            ("COMPLETED", "Completed"),
            ("ERROR", "Error"),
        ],
        default="PENDING",
    )

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.process_step_run()

    def process_step_run(self):
        try:
            self.status = "IN_PROGRESS"
            self.save(update_fields=["status"])

            # Determine the next step to run
            next_step = self.determine_next_step()
            if next_step:
                self.flow_step = next_step
                self.save(update_fields=["flow_step"])

                self.perform_action()

                self.status = "COMPLETED"
            else:
                self.status = "ERROR"
                self.result = {"error": "No next step found"}

            self.save(update_fields=["status", "result"])
        except Exception as e:
            logger.exception(f"Error processing step run: {str(e)}")
            self.status = "ERROR"
            self.result = {"error": str(e)}
            self.save(update_fields=["status", "result"])

    def perform_action(self):
        from channels.models import Channel
        from credentials.models import Credentials as CredentialsModel
        from users.models import User

        if not self.flow_step:
            raise ValueError("No flow step associated with this StepRun")

        action_type = self.flow_step.action_type
        model_class = apps.get_model(
            self.flow_step.model.app_label, self.flow_step.model.name
        )

        if action_type == "CREATE" and model_class == Channel:
            flow_run_state = self.flow_run.state

            try:
                default_user = User.objects.first()

                default_credentials, _ = CredentialsModel.objects.get_or_create(
                    workspace=self.flow_run.workspace,
                    key="DEFAULT_GMAIL_CREDENTIALS",
                    defaults={"value": '{"dummy": "credentials"}'},
                )

                channel_email = flow_run_state.get(
                    "channel_email", "default@example.com"
                )

                new_channel = Channel.objects.create(
                    user=default_user,
                    email=channel_email,
                    workspace=self.flow_run.workspace,
                    gmail_credentials=default_credentials,
                )

                self.result = {
                    "action": "CREATE",
                    "model": "Channel",
                    "id": new_channel.id,
                    "email": new_channel.email,
                }

                self.flow_run.state["created_channel_id"] = new_channel.id
                self.flow_run.save(update_fields=["state"])

                logger.info(
                    f"Created new channel: {new_channel.email} (ID: {new_channel.id})"
                )
            except Exception as e:
                logger.exception(f"Error creating channel: {str(e)}")
                raise

        else:
            self.result = {
                "action": action_type,
                "model": model_class.__name__,
                "message": "Action not implemented",
            }

    def determine_next_step(self):
        # Logic to determine the next step based on the flow and previous steps
        completed_steps = self.flow_run.step_runs.exclude(id=self.id).values_list(
            "flow_step", flat=True
        )
        next_step = self.flow_run.flow.steps.exclude(id__in=completed_steps).first()
        return next_step

    def __str__(self):
        return f"Step Run {self.id} of {self.flow_run}"

    @property
    def general_info(self):
        # Define what general_info should return for a StepRun
        return {
            "id": self.id,
            "flow_run": self.flow_run.id,
            "flow_step": self.flow_step.id,
            "created_at": self.created_at.isoformat(),
            # Add other relevant information
        }


from django.contrib import admin


class StepRunAdmin(admin.ModelAdmin):
    list_display = ["id", "flow_run", "status", "created_at"]
    readonly_fields = [
        "created_at",
        "get_input_data",
        "get_result",
        "status",
        "flow_step",
    ]

    def get_input_data(self, obj):
        return obj.input_data

    get_input_data.short_description = "Input Data"

    def get_result(self, obj):
        return obj.result

    get_result.short_description = "Result"

    def change_view(self, request, object_id, form_url="", extra_context=None):
        extra_context = extra_context or {}
        step_run = self.get_object(request, object_id)
        if step_run:
            extra_context["step_run_info"] = {
                "id": step_run.id,
                "flow_run": str(step_run.flow_run),
                "flow_step": str(step_run.flow_step)
                if step_run.flow_step
                else "Not determined yet",
                "status": step_run.get_status_display(),
                "created_at": step_run.created_at,
                "input_data": step_run.input_data,
                "result": step_run.result,
            }
        return super().change_view(request, object_id, form_url, extra_context)


from django.contrib import admin


class FlowStepAdmin(admin.ModelAdmin):
    fields = ["action_type", "model", "flow", "workspace"]

    def render_associated_form(self, model_admin, form, obj):
        from django.contrib.admin.helpers import AdminForm

        # Get fieldsets, readonly fields, and prepopulated fields from the model admin
        fieldsets = model_admin.get_fieldsets(self.request)
        readonly_fields = model_admin.get_readonly_fields(self.request)
        prepopulated_fields = model_admin.get_prepopulated_fields(self.request)

        admin_form = AdminForm(
            form,
            fieldsets,
            prepopulated_fields,
            readonly_fields,
            model_admin=model_admin,
        )

        # Get inline formsets
        inline_instances = model_admin.get_inline_instances(self.request, obj)
        inline_admin_formsets = []
        for inline in inline_instances:
            InlineFormSet = inline.get_formset(self.request, obj)
            formset = InlineFormSet(
                instance=obj,
                prefix=inline.get_formset_kwargs(self.request, obj).get("prefix", None),
            )
            inline_admin_formset = model_admin.get_admin_formset_helper(
                self.request, inline, formset
            )
            inline_admin_formsets.append(inline_admin_formset)

        # Check if there are any editable inline formsets
        has_editable_inline_admin_formsets = any(
            not inline_admin_formset.opts.readonly
            for inline_admin_formset in inline_admin_formsets
        )

        # Render the form using the change_form template
        context = {
            "adminform": admin_form,
            "form": form,
            "inline_admin_formsets": inline_admin_formsets,
            "is_popup": False,
            "add": True,
            "change": False,
            "has_view_permission": model_admin.has_view_permission(self.request, obj),
            "has_add_permission": model_admin.has_add_permission(self.request),
            "has_change_permission": model_admin.has_change_permission(
                self.request, obj
            ),
            "has_delete_permission": model_admin.has_delete_permission(
                self.request, obj
            ),
            "has_editable_inline_admin_formsets": has_editable_inline_admin_formsets,
            "has_absolute_url": False,
            "opts": model_admin.model._meta,
            "original": obj,
            "save_as": False,
            "show_save": False,
        }

        # Render to string instead of HttpResponse
        from django.template.loader import render_to_string

        return render_to_string(
            model_admin.change_form_template or "admin/change_form.html",
            context,
            request=self.request,
        )

    def get_form(self, request, obj=None, **kwargs):
        self.request = request
        return super().get_form(request, obj, **kwargs)


admin.site.register(FlowStep, FlowStepAdmin)
