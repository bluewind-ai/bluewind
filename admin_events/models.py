# In models.py (or a new file like admin_events.py)

from django.contrib.auth import get_user_model
from django.db import models
from workspaces.models import WorkspaceRelated

User = get_user_model()


class AdminEvent(WorkspaceRelated):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    data = models.JSONField()

    def __str__(self):
        return f"{self.action} on {self.model_name} {self.object_id} by {self.user}"
