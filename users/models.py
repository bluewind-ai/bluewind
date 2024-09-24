from django.contrib.auth.models import AbstractUser

from base_model.models import BaseModel
from users.after_create import users_after_create


class User(AbstractUser, BaseModel):
    def save(self, *args, **kwargs):
        if not self.pk:  # This is a new user
            self.is_staff = True
        super().save(*args, **kwargs)


def save(self, *args, **kwargs):  # noqa
    is_new = self.pk is None
    super().save(*args, **kwargs)

    if is_new:
        users_after_create(self)
