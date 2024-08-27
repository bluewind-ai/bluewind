from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    workspace_public_id = models.CharField(max_length=50)
    
    def __str__(self):
        return self.username