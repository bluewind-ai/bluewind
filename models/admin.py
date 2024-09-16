# admin.py

from django.contrib import admin

from base_model_admin.admin import InWorkspace

from .models import Model


@admin.register(Model)
class ModelAdmin(InWorkspace):
    list_display = ("name", "app_label", "workspace", "file")
    list_filter = ("app_label", "workspace")
    search_fields = ("name", "app_label", "file__path")
