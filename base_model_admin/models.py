from django.contrib import admin


class BaseAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        # By default, display all fields in the list view
        return [field.name for field in self.model._meta.fields]
