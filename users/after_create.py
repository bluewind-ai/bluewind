def users_after_create(user):
    from user_settings.models import UserSettings

    user.is_staff = True
    UserSettings.objects.create(user=user)
