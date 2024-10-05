# Create your models here.
from django.db import models

from domain_names.models import DomainName


class DNSRecord(models.Model):
    domain = models.ForeignKey(
        DomainName, on_delete=models.CASCADE, related_name="dns_records"
    )
    name = models.CharField(
        max_length=253, blank=True, help_text="Subdomain or empty for apex"
    )
    record_type = models.CharField(
        max_length=10, choices=[("MX", "MX"), ("TXT", "TXT")]
    )
    value = models.TextField()
    priority = models.IntegerField(
        null=True, blank=True, help_text="Priority for MX records"
    )

    def __str__(self):
        full_name = f"{self.name}.{self.domain.name}" if self.name else self.domain.name
        if self.record_type == "MX":
            return f"{full_name} - MX - {self.priority} {self.value}"
        else:
            return f"{full_name} - TXT - {self.value[:50]}..."

    @property
    def full_name(self):
        return f"{self.name}.{self.domain.name}" if self.name else self.domain.name
