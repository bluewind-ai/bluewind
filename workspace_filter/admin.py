from custom_user.models import User
from django.contrib.auth.admin import UserAdmin


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = UserAdmin.list_display + ("workspace_public_id",)
    fieldsets = UserAdmin.fieldsets + ((None, {"fields": ("workspace_public_id",)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {"fields": ("workspace_public_id",)}),
    )
