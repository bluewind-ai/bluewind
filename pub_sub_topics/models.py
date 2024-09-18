from django.db import models

from workspaces.models import WorkspaceRelated

# Create your models here.


class PubSubTopic(WorkspaceRelated):
    project_id = models.CharField(max_length=100)
    topic_id = models.CharField(max_length=100)

    @property
    def full_topic_name(self):
        return f"projects/{self.project_id}/topics/{self.topic_id}"

    def __str__(self):
        return f"{self.topic_id} in {self.project_id}"

    class Meta:
        unique_together = ["project_id", "topic_id"]
