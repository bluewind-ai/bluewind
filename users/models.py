from base_model.models import BaseModel
from django.contrib.auth.models import AbstractUser


class User(AbstractUser, BaseModel):
    pass
