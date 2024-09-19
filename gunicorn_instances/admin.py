# Register your models here.
from django import forms

from base_model_admin.admin import InWorkspace

from .models import GunicornInstance


class GunicornInstanceCreateForm(forms.ModelForm):
    class Meta:
        model = GunicornInstance
        fields = []


class GunicornInstanceUpdateForm(forms.ModelForm):
    class Meta:
        model = GunicornInstance
        exclude = ["created_at", "updated_at", "pid", "status"]


class GunicornInstanceViewForm(forms.ModelForm):
    class Meta:
        model = GunicornInstance
        fields = []


class GunicornInstanceAdmin(InWorkspace):
    form = GunicornInstanceCreateForm

    def get_form(self, request, obj=None, **kwargs):
        if not obj:
            return GunicornInstanceCreateForm
        if request.method == "GET":
            return GunicornInstanceViewForm
        return GunicornInstanceUpdateForm
