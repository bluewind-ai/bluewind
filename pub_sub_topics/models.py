from django.db import models

from pub_sub_topics.after_create import pub_sub_topics_after_create
from pub_sub_topics.after_update import pub_sub_topics_after_update
from pub_sub_topics.before_create import pub_sub_topics_before_create
from pub_sub_topics.before_update import pub_sub_topics_before_update
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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            pub_sub_topics_before_create(self)
        else:
            pub_sub_topics_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            pub_sub_topics_after_create(self)
        else:
            pub_sub_topics_after_update(self)
