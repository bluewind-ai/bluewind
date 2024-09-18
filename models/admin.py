# admin.py

from django.contrib import admin

from base_model_admin.admin import InWorkspace

from .models import Model


@admin.register(Model)
class ModelAdmin(InWorkspace):
    list_display = ("app", "workspace", "file")
    list_filter = ("app", "workspace")
    search_fields = ("app", "file__path")
