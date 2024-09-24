def users_after_create(user):
    from user_settings.models import UserSettings

    UserSettings.objects.create(user=user)
