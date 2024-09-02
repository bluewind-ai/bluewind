from django.contrib import admin


class BaseAdmin(admin.ModelAdmin):
    def get_readonly_fields(self, request, obj=None):
        # By default, make all fields readonly
        return [field.name for field in self.model._meta.fields]

    def get_list_display(self, request):
        # By default, display all fields in the list view
        return [field.name for field in self.model._meta.fields]

    def get_fields(self, request, obj=None):
        # By default, include all fields in the detail view
        return [field.name for field in self.model._meta.fields]
