from django.db import models

from base64_utils.after_create import base64_utils_before_create
from base64_utils.after_update import base64_utils_after_update
from base64_utils.before_create import base64_utils_after_create
from base64_utils.before_update import base64_utils_before_update
from workspaces.models import WorkspaceRelated


class Base64Conversion(WorkspaceRelated):
    input_text = models.TextField()
    output_text = models.TextField(blank=True)
    operation = models.CharField(
        max_length=10,
        choices=[("encode", "Encode to Base64"), ("decode", "Decode from Base64")],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Base64 Conversion"
        verbose_name_plural = "Base64 Conversions"

    def __str__(self):
        return f"{self.operation} at {self.created_at}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            base64_utils_before_create(self)
        else:
            base64_utils_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            base64_utils_after_create(self)
        else:
            base64_utils_after_update(self)
