
from django.db import models

from bluewind.do_not_log import DO_NOT_LOG
from workspace_snapshots.after_create import workspace_snapshots_after_create
from workspace_snapshots.after_update import workspace_snapshots_after_update
from workspace_snapshots.before_create import workspace_snapshots_before_create
from workspace_snapshots.before_update import workspace_snapshots_before_update
from workspaces.models import WorkspaceRelated


class WorkspaceSnapshot(WorkspaceRelated):
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Dump for {self.workspace} at {self.created_at} id {self.id}"

    @staticmethod
    def get_snapshot_blacklist():
        # Return the blacklist as strings in the format 'app_label.ModelName'
        return DO_NOT_LOG

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            workspace_snapshots_before_create(self)
        else:
            workspace_snapshots_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            workspace_snapshots_after_create(self)
        else:
            workspace_snapshots_after_update(self)
