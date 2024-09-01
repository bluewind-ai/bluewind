from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = UserAdmin.list_display + ('workspace_public_id',)
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('workspace_public_id',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('workspace_public_id',)}),
    )

from workspaces.models import custom_admin_site

custom_admin_site.register(User, CustomUserAdmin)