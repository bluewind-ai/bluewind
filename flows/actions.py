import logging

from django.contrib.contenttypes.models import ContentType
from django.db import models

from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)


class Action(WorkspaceRelated):
    class ActionType(models.TextChoices):
        CREATE = "CREATE", "Create"
        SAVE = "SAVE", "Save"
        DELETE = "DELETE", "Delete"
        CUSTOM = "CUSTOM", "Custom"
        LIST = "LIST", "List"
        SHOW = "SHOW", "Show"

    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    is_recorded = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.content_type.model} {self.get_action_type_display()}"

    class Meta:
        unique_together = ("workspace", "action_type", "content_type")
