from django.db import models

from workspace_diffs.before_create import workspace_diffs_before_create
from workspaces.models import WorkspaceRelated


# Create your models here.
class WorkspaceDiff(WorkspaceRelated):
    snapshot_before = models.ForeignKey(
        "workspace_snapshots.WorkspaceSnapshot",
        on_delete=models.CASCADE,
        related_name="diffs_as_before",
    )
    snapshot_after = models.ForeignKey(
        "workspace_snapshots.WorkspaceSnapshot",
        on_delete=models.CASCADE,
        related_name="diffs_as_after",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    diff_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Diff for {
            self.workspace} id {
            self.workspace.id} from {
            self.snapshot_before.created_at} to {
                self.snapshot_after.created_at}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            workspace_diffs_before_create(self)
        super().save(*args, **kwargs)
