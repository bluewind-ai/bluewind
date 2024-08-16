from django.db import models
from django.contrib.auth.models import User

from base_model.models import BaseModel

class Inbox(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email