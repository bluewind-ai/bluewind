from django.db import models
from django.forms import ValidationError

from functions.models import Function


# Create your models here.
class FunctionDependency(models.Model):
    dependent = models.ForeignKey(
        Function, on_delete=models.CASCADE, related_name="dependency_relations"
    )
    dependency = models.ForeignKey(
        Function, on_delete=models.CASCADE, related_name="dependent_relations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["dependent", "dependency"]

    def clean(self):
        if self.dependent == self.dependency:
            raise ValidationError("A function cannot depend on itself.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.dependent.name} depends on {self.dependency.name}"
