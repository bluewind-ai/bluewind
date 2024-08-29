import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
from django.db import models
from django.contrib import admin
from django.shortcuts import redirect, render
from django.utils import timezone
from django.urls import path
from base_model.models import BaseModel
from workspace_filter.models import User
from workspaces.models import custom_admin_site
from chat_messages.models import Message
import base64
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow, Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv
from django.contrib import messages as django_messages

class Inbox(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email

SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
    'https://www.googleapis.com/auth/gmail.readonly'
]

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
            creds = flow.run_local_server(port=0)  # Use a random available port

        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    service = build('gmail', 'v1', credentials=creds)
    return service

def create_messages_from_gmail():
    service = get_gmail_service()
    results = service.users().messages().list(userId='me', maxResults=10).execute()
    messages = results.get('messages', [])

    if not messages:
        return 0

    user, created = User.objects.get_or_create(username='gmail_user')
    created_count = 0

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
        created_count += 1

    return created_count

class InboxAdmin(admin.ModelAdmin):
    list_display = ('email', 'user')
    actions = ['create_messages_from_gmail', 'connect_inbox']

    def create_messages_from_gmail(self, request, queryset):
        try:
            created_count = create_messages_from_gmail()
            self.message_user(request, f"{created_count} messages have been created from Gmail successfully.", level=django_messages.SUCCESS)
        except Exception as e:
            self.message_user(request, f"An error occurred: {str(e)}", level=django_messages.ERROR)

    create_messages_from_gmail.short_description = "Create messages from Gmail"

    def connect_inbox(self, request, queryset):
        try:
            client_secret_file = os.path.expanduser(os.getenv('GMAIL_CLIENT_SECRET_FILE'))
            flow = Flow.from_client_secrets_file(
                client_secret_file,
                scopes=['https://www.googleapis.com/auth/gmail.readonly'],
                redirect_uri='http://localhost:8000/oauth2callback'
            )

            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true'
            )

            request.session['state'] = state

            return redirect(authorization_url)

        except Exception as e:
            self.message_user(request, f"An error occurred while connecting the inbox: {str(e)}", level=django_messages.ERROR)

    connect_inbox.short_description = "Connect the inbox"

custom_admin_site.register(Inbox, InboxAdmin)

def oauth2callback(request):
    state = request.session['state']
    
    flow = Flow.from_client_secrets_file(
    'google_api_secrets.json',
    scopes=[
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
    ]
)
    flow.redirect_uri = 'http://localhost:8000/oauth2callback'

    authorization_response = request.build_absolute_uri()
    flow.fetch_token(authorization_response=authorization_response)

    credentials = flow.credentials
    # Here, you would typically save these credentials associated with the user or inbox

    return render(request, 'oauth2callback.html', {'message': 'Successfully connected inbox!'})