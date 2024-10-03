import logging

# Assuming these are defined elsewhere
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.forms import ValidationError
from django.utils import timezone
from django.utils.html import format_html

from bluewind.context_variables import (
    get_function,
    get_function_call,
    get_startup_mode,
    get_workspace_id,
)
from users.models import User


class Workspace(models.Model):
    class BootstrapStatus(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        PENDING = "pending", "Pending"
        DONE = "done", "Done"

    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(
        "users.User", through="workspace_users.WorkspaceUser", related_name="workspaces"
    )
    user = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="owned_workspaces"
    )
    bootstrap_status = models.CharField(
        max_length=20,
        choices=BootstrapStatus.choices,
        default=BootstrapStatus.NOT_STARTED,
    )

    def __str__(self):
        return self.name

    def get_admin_url(self):
        return f"/workspaces/{self.id}/admin/"

    def admin_url_link(self):
        url = self.get_admin_url()
        return format_html('<a href="{}">{}</a>', url, url)

    admin_url_link.short_description = "Admin URL"


class WorkspaceAdmin(admin.ModelAdmin):
    readonly_fields = ("admin_url_link",)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        workspace_id = get_workspace_id()
        logger.debug(f"formfield_for_foreignkey: workspace_id = {workspace_id}")

        if db_field.name == "user":  # Add this condition
            kwargs["initial"] = request.user
            kwargs["queryset"] = User.objects.filter(id=request.user.id)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)


logger = logging.getLogger(__name__)


class WorkspaceRelatedManager(models.Manager):
    def get_queryset(self):
        queryset = super().get_queryset()

        # Get all foreign key field names
        foreign_key_fields = [
            f.name for f in self.model._meta.fields if isinstance(f, models.ForeignKey)
        ]

        # Apply select_related for all foreign key fields
        queryset = queryset.select_related(*foreign_key_fields)
        if not get_startup_mode():
            return queryset.filter(workspace_id=get_workspace_id())
        return queryset


class WorkspaceRelatedMeta(models.base.ModelBase):
    def __new__(mcs, name, bases, attrs):
        new_class = super().__new__(mcs, name, bases, attrs)

        if not new_class._meta.abstract:
            new_class._meta.unique_together_check = True

        return new_class


class WorkspaceRelated(models.Model, metaclass=WorkspaceRelatedMeta):
    workspace = models.ForeignKey("workspaces.Workspace", on_delete=models.CASCADE)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    function_call = models.ForeignKey(
        "function_calls.FunctionCall", on_delete=models.CASCADE
    )
    function = models.ForeignKey("functions.Function", on_delete=models.CASCADE)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    objects = WorkspaceRelatedManager()

    class Meta:
        abstract = True

    @classmethod
    def check(cls, **kwargs):
        errors = super().check(**kwargs)

        if not cls._meta.abstract and getattr(
            cls._meta, "unique_together_check", False
        ):
            if "name" in cls._meta.fields or "name" in cls._meta.local_fields:
                if (
                    not cls._meta.unique_together
                    or ["name", "workspace"] not in cls._meta.unique_together
                ):
                    raise ValidationError(
                        f"Model {cls.__name__} has a 'name' field but doesn't have "
                        "['name', 'workspace'] in its unique_together constraint."
                    )

        return errors

    def save(self, *args, **kwargs):
        # raise_debug("Workspace", skip=0)
        function = get_function()
        if function:
            self.function = function
        else:
            self.function = None

        function_call = get_function_call()
        if function_call:
            self.function_call = function_call
        else:
            self.function_call = None
        self.user_id = 1
        self.workspace_id = get_workspace_id()

        super().save(*args, **kwargs)

    def get_model_instance(self):
        return ContentType.objects.get_for_model(self.__class__)

    @classmethod
    def get_content_type(cls):
        return ContentType.objects.get_for_model(cls)
