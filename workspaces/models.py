from django.utils import timezone  # Change this line
import uuid
from django.db import models

import uuid
from django.db import models
from django.utils import timezone

from base_model.models import BaseModel
from workspace_filter.models import User

class Workspace(BaseModel):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(User, through='WorkspaceUser')

    def __str__(self):
        return f"Workspace object ({self.id.int})"

class WorkspaceUser(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'workspace')

        