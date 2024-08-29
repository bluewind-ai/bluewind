from django.db import models
from base_model.models import BaseModel
from leads.models import Lead

class Message(BaseModel):
    from inboxes.models import Inbox
    sender = models.ForeignKey(Inbox, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    subject = models.CharField(max_length=255, blank=True, null=True)
    gmail_message_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    def __str__(self):
        return f"From {self.sender.email} to {self.recipient}: {self.content[:50]}"

# Admin registration remains the same
from django.contrib import admin
from workspaces.models import custom_admin_site

class MessageAdmin(admin.ModelAdmin):
    pass

custom_admin_site.register(Message, MessageAdmin)