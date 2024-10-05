from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from domain_names.models import DomainName


class DNSRecord(models.Model):
    RECORD_TYPE_CHOICES = [("MX", "MX"), ("TXT", "TXT")]
    APEX_PLACEHOLDER = "@"

    domain = models.ForeignKey(
        DomainName, on_delete=models.CASCADE, related_name="dns_records"
    )
    name = models.CharField(
        max_length=253, default=APEX_PLACEHOLDER, help_text="Subdomain or '@' for apex"
    )
    record_type = models.CharField(max_length=10, choices=RECORD_TYPE_CHOICES)
    value = models.TextField()
    priority = models.IntegerField(
        null=True,
        blank=True,
        help_text="Priority for MX records",
        validators=[MinValueValidator(0), MaxValueValidator(65535)],
    )

    class Meta:
        unique_together = [
            ["domain", "name", "record_type", "value", "priority"],
        ]

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.record_type == "MX" and self.priority is None:
            raise ValidationError("Priority is required for MX records")
        if self.record_type == "TXT" and self.priority is not None:
            raise ValidationError("Priority should not be set for TXT records")
        if not self.name:
            self.name = self.APEX_PLACEHOLDER

    def save(self, *args, **kwargs):
        # self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        full_name = self.full_name
        if self.record_type == "MX":
            return f"{full_name} - MX - {self.priority} {self.value}"
        else:
            return f"{full_name} - TXT - {self.value[:50]}..."

    @property
    def full_name(self):
        if self.name == self.APEX_PLACEHOLDER:
            return self.domain.name
        return f"{self.name}.{self.domain.name}"
