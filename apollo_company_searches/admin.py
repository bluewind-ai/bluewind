from django import forms

from base_admin.admin import InWorkspace

from .models import ApolloCompanySearch


class ApolloCompanySearchAdmin(InWorkspace):
    fields = ["organization_num_employees_ranges", "function_call", "user"]

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == "organization_num_employees_ranges":
            return forms.MultipleChoiceField(
                choices=ApolloCompanySearch.EMPLOYEE_RANGE_CHOICES,
                widget=forms.CheckboxSelectMultiple,
                required=False,
            )
        return super().formfield_for_dbfield(db_field, request, **kwargs)
