# workspaces/models.py
import json
import logging

from django.contrib.contenttypes.models import ContentType
from django.db import models

from users.models import User
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger("django.not_used")


class FlowRun(WorkspaceRelated):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    input_data = models.JSONField(null=True, blank=True)
    result = models.TextField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    flow = models.ForeignKey("flows.Flow", on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        logger.debug(f"Preparing to save FlowRun: {self}")
        logger.debug(f"input_data: {self.input_data} (Type: {type(self.input_data)})")

        # If 'content_type' is in input_data, convert natural key back to ContentType ID
        if "content_type" in self.input_data:
            natural_key = self.input_data["content_type"]
            try:
                content_type = ContentType.objects.get_by_natural_key(*natural_key)
                self.input_data["content_type_id"] = (
                    content_type.id
                )  # Use ID for JSONField
                del self.input_data[
                    "content_type"
                ]  # Remove the tuple to avoid serialization issues
                logger.debug(
                    f"Converted 'content_type' natural key {natural_key} to ID: {content_type.id}"
                )
            except ContentType.DoesNotExist:
                logger.error(
                    f"ContentType with natural key {natural_key} does not exist."
                )
                raise

        # Attempt to serialize input_data to JSON
        try:
            json.dumps(self.input_data)
        except TypeError as e:
            logger.error(f"Error serializing input_data: {e}")
            raise

        super().save(*args, **kwargs)
        logger.debug("FlowRun saved successfully.")

    def __str__(self):
        return f"FlowRun {self.id} by {self.user} on {self.executed_at}"
