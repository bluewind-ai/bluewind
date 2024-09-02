from django_object_actions import DjangoObjectActions, action
from model_clone import CloneMixin

# Assuming these are defined elsewhere
from bluewind.utils import uuid7
from custom_user.models import User
from django.apps import apps
from django.contrib import admin, messages
from django.db import models, transaction
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from public_id.models import public_id


class Workspace(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)

    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(User, through="WorkspaceUser")
    public_id = models.CharField(max_length=100, unique=True, editable=False)

    def save(self, *args, **kwargs):
        if not self.public_id:
            self.public_id = public_id(self.__class__.__name__, self.id or uuid7())
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_admin_url(self):
        return f"/{self.public_id}/admin/"

    def admin_url_link(self):
        url = self.get_admin_url()
        return format_html('<a href="{}">{}</a>', url, url)

    admin_url_link.short_description = "Admin URL"


class WorkspaceUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "workspace")


def clone_workspace(workspace, request):
    with transaction.atomic():
        # Create a new workspace
        new_workspace = Workspace.objects.create(name=f"Clone of {workspace.name}")

        # Get all models in the project
        all_models = apps.get_models()

        # Iterate through all models and clone related objects
        for model in all_models:
            # Check if the model has a relationship with Workspace and inherits from CloneMixin
            if any(
                field.related_model == Workspace for field in model._meta.fields
            ) and issubclass(model, CloneMixin):
                # Get all objects related to the original workspace
                related_objects = model.objects.filter(workspace=workspace)

                # Clone each related object
                for obj in related_objects:
                    # Use make_clone method
                    new_obj = obj.make_clone(attrs={"workspace": new_workspace})

                    # If public_id is not excluded from cloning, generate a new one
                    if hasattr(new_obj, "public_id") and "public_id" not in getattr(
                        new_obj, "_clone_excluded_fields", []
                    ):
                        new_obj.public_id = public_id(
                            new_obj.__class__.__name__, uuid7()
                        )
                        new_obj.save(update_fields=["public_id"])

        return new_workspace


# Create an instance of the custom admin site


class WorkspaceUserAdmin(admin.ModelAdmin):
    @property
    def public_id(self):
        public_id(self.__class__.__name__, self.id)

    def get_list_display(self, request):
        return [field.name for field in self.model._meta.fields]


class WorkspaceAdmin(DjangoObjectActions, admin.ModelAdmin):
    list_display = ("name", "id", "created_at")
    actions = ["clone_workspace_action"]
    readonly_fields = ("admin_url_link",)
    changelist_actions = ("delete_current_workspace",)

    @action(
        label="Delete Current Workspace",
        description="Permanently delete the current workspace",
        attrs={"style": "color: red;"},
    )
    def delete_current_workspace(self, request, queryset):
        current_workspace_public_id = request.environ.get("WORKSPACE_PUBLIC_ID")
        if current_workspace_public_id:
            try:
                workspace = Workspace.objects.get(public_id=current_workspace_public_id)
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
