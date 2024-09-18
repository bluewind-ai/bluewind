from django.db import models

from recordings.after_create import recordings_after_create
from recordings.after_update import recordings_after_update
from recordings.before_create import recordings_before_create
from recordings.before_update import recordings_before_update

# Create your models here.
from workspaces.models import WorkspaceRelated


class Recording(WorkspaceRelated):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ["name", "workspace"]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            recordings_before_create(self)
        else:
            recordings_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            recordings_after_create(self)
        else:
            recordings_after_update(self)
