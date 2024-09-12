# models.py
import logging

from django import forms
from django.db import models
from django.db.models import JSONField
from django_json_widget.widgets import JSONEditorWidget
from model_clone import CloneMixin

logger = logging.getLogger(__name__)


class BaseModel(CloneMixin, models.Model):
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        abstract = True

    _clone_excluded_fields = [
        "id",
    ]


class BaseModelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if isinstance(self.instance._meta.get_field(field_name), JSONField):
                self.fields[field_name].widget = JSONEditorWidget()

    class Meta:
        abstract = True
