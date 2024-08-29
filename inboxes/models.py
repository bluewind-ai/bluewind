from django.db import models
from django.contrib import admin
from django.utils import timezone
from base_model.models import BaseModel
from workspace_filter.models import User
from workspaces.models import custom_admin_site
import base64
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv

class Inbox(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_gmail_service():
    load_dotenv()
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            client_secret_file = os.path.expanduser(os.getenv('GMAIL_CLIENT_SECRET_FILE'))
            flow = InstalledAppFlow.from_client_secrets_file(
                client_secret_file, SCOPES)
            creds = flow.run_local_server(port=8080)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    return build('gmail', 'v1', credentials=creds)

from chat_messages.models import Message

def create_messages_from_gmail():
    service = get_gmail_service()
    results = service.users().messages().list(userId='me', maxResults=10).execute()
    messages = results.get('messages', [])

    if not messages:
        return

    user, created = User.objects.get_or_create(username='gmail_user')

    for message in messages:
        msg = service.users().messages().get(userId='me', id=message['id']).execute()
        subject = next((header['value'] for header in msg['payload']['headers'] if header['name'] == 'Subject'), 'No Subject')
        sender = next((header['value'] for header in msg['payload']['headers'] if header['name'] == 'From'), 'Unknown')
        
        if 'parts' in msg['payload']:
            body = base64.urlsafe_b64decode(msg['payload']['parts'][0]['body']['data']).decode('utf-8')
        else:
            body = base64.urlsafe_b64decode(msg['payload']['body']['data']).decode('utf-8')

        Message.objects.create(
            sender=user,
            recipient=user,
            subject=subject[:255],
            content=body,
            timestamp=timezone.now(),
            is_read=False
        )

class InboxAdmin(admin.ModelAdmin):
    list_display = ('email', 'user')
    actions = ['create_messages_from_gmail']

    def create_messages_from_gmail(self, request, queryset):
        create_messages_from_gmail()
        self.message_user(request, "Messages have been created from Gmail successfully.")

    create_messages_from_gmail.short_description = "Load recent messages from Gmail"

custom_admin_site.register(Inbox, InboxAdmin)