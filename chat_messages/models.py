from django.db import models

from base_model.models import BaseModel
from chat_messages.services import create_messages_from_gmail
from workspace_filter.models import User

class Message(BaseModel):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    subject = models.CharField(max_length=255, blank=True, null=True)  # Make subject optional

    def __str__(self):
        return f"From {self.sender} to {self.recipient}: {self.content[:50]}"
from django.contrib import admin

class MessageAdmin(admin.ModelAdmin):
    pass

from workspaces.models import custom_admin_site
custom_admin_site.register(Message, MessageAdmin)