import logging

from django import forms

from domain_names.models import DomainName

logger = logging.getLogger("django.not_used")


class DomainNameFormV1(forms.ModelForm):
    class Meta:
        model = DomainName
        fields = [
            "name",
        ]
