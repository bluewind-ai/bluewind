import logging

from django_object_actions import DjangoObjectActions, action

from admin_autoregister.register_flows import load_flows

# Assuming these are defined elsewhere
from django.apps import apps
from django.contrib import admin, messages
from django.contrib.auth.models import User
from django.db import models
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from users.models import User


class Workspace(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(User, through="WorkspaceUser")

    def __str__(self):
        return self.name

    def get_admin_url(self):
        return f"/workspaces/{self.id}/admin/"

    def admin_url_link(self):
        url = self.get_admin_url()
        return format_html('<a href="{}">{}</a>', url, url)

    admin_url_link.short_description = "Admin URL"

    def save(self, *args, **kwargs):
        from flows.models import Recording  # Import the Recording model

        is_new = self.pk is None
        super().save(*args, **kwargs)
        from admin_autoregister.register_actions import register_actions_and_models

        if is_new:
            register_actions_and_models(self)
            load_flows(self)

            # Create a new Recording for this workspace
            Recording.objects.create(
                name=f"Default Recording for {self.name}",
                description=f"Automatically created recording for workspace {self.name}",
                start_time=timezone.now(),
                workspace=self,
            )


class WorkspaceUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "workspace")


class WorkspaceUserAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return [field.name for field in self.model._meta.fields]


class WorkspaceAdmin(DjangoObjectActions, admin.ModelAdmin):
    actions = ["clone_workspace_action"]
    readonly_fields = ("admin_url_link",)
    changelist_actions = ("delete_current_workspace",)

    @action(
        label="Delete Current Workspace",
        description="Permanently delete the current workspace",
        attrs={"style": "color: red;"},
    )
    def delete_current_workspace(self, request, queryset):
        current_workspace_id = request.environ.get("WORKSPACE_ID")
        if current_workspace_id:
            try:
                workspace = Workspace.objects.get(id=current_workspace_id)
                url = reverse("admin:workspaces_workspace_delete", args=[workspace.id])
                return HttpResponseRedirect(url)
            except Workspace.DoesNotExist:
                self.message_user(
                    request, "Current workspace not found.", level=messages.ERROR
                )
        else:
            self.message_user(
                request, "No current workspace identified.", level=messages.ERROR
            )

        return HttpResponseRedirect(request.get_full_path())

    def clone_workspace_action(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(
                request,
                "Please select only one workspace to clone.",
                level=messages.WARNING,
            )
            return

        workspace = queryset.first()
        new_workspace = clone_workspace(workspace, request)

        self.message_user(
            request,
            f"Workspace '{workspace.name}' has been cloned successfully.",
            level=messages.SUCCESS,
        )

        # Redirect to the change page of the new workspace
        return HttpResponseRedirect(
            reverse("customadmin:workspaces_workspace_change", args=[new_workspace.id])
        )

    clone_workspace_action.short_description = "Clone selected workspace"


logger = logging.getLogger(__name__)


class WorkspaceRelatedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related("workspace")


from django.db import models


class WorkspaceRelated(models.Model):
    workspace = models.ForeignKey("workspaces.Workspace", on_delete=models.CASCADE)
    objects = WorkspaceRelatedManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.update_entity()

    def update_entity(self):
        # Skip update_entity for Entity model
        if (
            self._meta.model_name == "entity"
            # or self._meta.model_name == "workspaceexport"
        ):
            return

        Entity = apps.get_model("entity", "Entity")
        model = self.get_model_instance()
        name = str(self)[:255]  # Truncate to 255 characters

        Entity.objects.update_or_create(
            workspace=self.workspace,
            model=model,
            defaults={
                "name": name,
                "updated_at": models.functions.Now(),
            },
        )

    def get_model_instance(self):
        Model = apps.get_model("flows", "Model")
        model, _ = Model.objects.get_or_create(
            name=self._meta.model_name,
            app_label=self._meta.app_label,
            workspace=self.workspace,
        )
        return model
