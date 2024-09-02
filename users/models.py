from base_model.models import BaseModel
from django.contrib.auth.models import AbstractUser


class User(AbstractUser, BaseModel):
    def save(self, *args, **kwargs):
        if not self.pk:  # This is a new user
            self.is_staff = True
        super().save(*args, **kwargs)
