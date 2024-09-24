from django.contrib.auth.models import AbstractUser

from base_model.models import BaseModel
from users.after_create import users_after_create


class User(AbstractUser, BaseModel):
    def save(self, *args, **kwargs):
        is_new = self.pk is None

        if is_new:
            self.is_staff = True
        super().save(*args, **kwargs)
        if is_new:
            users_after_create(self)
