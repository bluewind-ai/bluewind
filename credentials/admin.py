from django import forms

from base_admin.admin import InWorkspace
from unfold.widgets import UnfoldAdminPasswordInput

# class UnfoldAdminMaskedInputWidget(UnfoldAdminPasswordInput):
#     def __init__(self, attrs=None):
#         super().__init__(attrs, render_value=True)


class CredentialAdmin(InWorkspace):
    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == "value":
            # debugger("cdsncjkdsn")
            return forms.CharField(widget=UnfoldAdminPasswordInput())
        return super().formfield_for_dbfield(db_field, request, **kwargs)
