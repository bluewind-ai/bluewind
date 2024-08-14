from unfold import admin

from chat_messages.services import create_messages_from_gmail
from test_gmail import get_last_10_emails
from .models import Inbox
from django.utils import timezone

@admin.register(Inbox)
class InboxAdmin(admin.ModelAdmin):
    list_display = ('email', 'user')
    actions = ['fetch_last_10_emails']

    actions = ['create_messages_from_gmail']

    def create_messages_from_gmail(self, request, queryset):
        create_messages_from_gmail()
        self.message_user(request, "Messages have been created from Gmail successfully.")
    
    create_messages_from_gmail.short_description = "Create messages from Gmail"