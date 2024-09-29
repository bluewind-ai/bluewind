from django.db import models
from django.forms import ValidationError


# Create your models here.
class FunctionCallDependency(models.Model):
    dependent = models.ForeignKey(
        "function_calls.FunctionCall",
        on_delete=models.CASCADE,
        related_name="dependency_relations",
    )
    dependency = models.ForeignKey(
        "function_calls.FunctionCall",
        on_delete=models.CASCADE,
        related_name="dependent_relations",
    )
    data = models.JSONField(default=dict, blank=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["dependent", "dependency"]

    def clean(self):
        if self.dependent == self.dependency:
            raise ValidationError("A function cannot depend on itself.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
