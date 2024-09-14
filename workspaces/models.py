import logging

# Assuming these are defined elsewhere
from django.apps import apps
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.forms import ValidationError
from django.utils import timezone
from django.utils.html import format_html

from admin_autoregister.register_flows import load_flows
from bluewind.context_variables import get_startup_mode, get_workspace_id
from bluewind.do_not_log import DO_NOT_LOG
from users.models import User


class Workspace(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(
        User, through="WorkspaceUser", related_name="workspaces"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_workspaces"
    )

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
                user=self.user,  # Use the user who created the workspace
            )

            # Add the user who created the workspace to its users
            WorkspaceUser.objects.create(workspace=self, user=self.user)


class WorkspaceUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "workspace")


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


from django.core.exceptions import ValidationError
from django.db import models


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
        super().save(*args, **kwargs)
        self.update_entity()

    def update_entity(self):
        model_str = f"{self._meta.app_label}.{self._meta.object_name}"

        if model_str in DO_NOT_LOG:
            return

        Entity = apps.get_model("entity", "Entity")
        content_type = self.get_model_instance()
        name = str(self)[:255]  # Truncate to 255 characters

        Entity.objects.update_or_create(
            workspace=self.workspace,
            content_type=content_type,
            object_id=self.pk,
            defaults={
                "name": name,
                "updated_at": models.functions.Now(),
                "user": self.user,
            },
        )

    def get_model_instance(self):
        return ContentType.objects.get_for_model(self.__class__)

    @classmethod
    def get_content_type(cls):
        return ContentType.objects.get_for_model(cls)
