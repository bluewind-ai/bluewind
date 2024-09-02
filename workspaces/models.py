import logging

from django_object_actions import DjangoObjectActions, action

# Assuming these are defined elsewhere
from base_model.models import BaseModel
from django.contrib import admin, messages
from django.db import IntegrityError, models
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from public_id.models import public_id
from users.models import User


class Workspace(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(User, through="WorkspaceUser")
    public_id = models.CharField(max_length=100, unique=True, editable=False)

    def save(self, *args, **kwargs):
        if not self.public_id:
            max_attempts = 3
            for attempt in range(max_attempts):
                try:
                    self.public_id = public_id()
                    super().save(*args, **kwargs)
                    return
                except IntegrityError:
                    if attempt == max_attempts - 1:
                        raise
        else:
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
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "workspace")


class WorkspaceUserAdmin(admin.ModelAdmin):
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


logger = logging.getLogger(__name__)


class WorkspaceRelated(BaseModel):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)

    class Meta:
        abstract = True
