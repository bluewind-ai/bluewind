from base_model_admin.admin import InWorkspace
from credentials.models import Credentials, CredentialsForm
from django.contrib import admin

# Register your models here.


@admin.register(Credentials)
class CredentialsAdmin(InWorkspace):
    form = CredentialsForm

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
