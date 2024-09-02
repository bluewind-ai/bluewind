from django.contrib.auth.admin import UserAdmin
from users.models import User


class UserAdmin(UserAdmin):
    model = User
    list_display = UserAdmin.list_display + ("workspace_public_id",)
    fieldsets = UserAdmin.fieldsets + ((None, {"fields": ("workspace_public_id",)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {"fields": ("workspace_public_id",)}),
    )
