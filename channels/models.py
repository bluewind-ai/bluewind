import os

from base_model_admin.models import BaseAdmin
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
from django.db import models
from django.contrib import admin
from django.shortcuts import redirect, render
from django.utils import timezone
from django.urls import path, reverse
from base_model.models import BaseModel
from workspace_filter.models import User
from workspaces.models import custom_admin_site
import base64
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow, Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv
from django.contrib import messages as django_messages

class Channel(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email

SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'  # Add this for sending emails
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

def fetch_messages_from_gmail():
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
        channel = next((header['value'] for header in msg['payload']['headers'] if header['name'] == 'From'), 'Unknown')

        if 'parts' in msg['payload']:
            body = base64.urlsafe_b64decode(msg['payload']['parts'][0]['body']['data']).decode('utf-8')
        else:
            body = base64.urlsafe_b64decode(msg['payload']['body']['data']).decode('utf-8')
        from chat_messages.models import Message

        # Check if the message already exists
        if not Message.objects.filter(gmail_message_id=message['id']).exists():
            Message.objects.create(
                channel=user,
                recipient=user,
                subject=subject[:255],
                content=body,
                timestamp=timezone.now(),
                is_read=False,
                gmail_message_id=message['id']
            )
            created_count += 1

    return created_count

class ChannelAdmin(BaseAdmin):
    list_display = ('email', 'user')
    actions = ['fetch_messages_from_gmail']

    def fetch_messages_from_gmail(self, request, queryset):
        try:
            created_count = fetch_messages_from_gmail()
            self.message_user(request, f"{created_count} messages have been created from Gmail successfully.", level=django_messages.SUCCESS)
        except Exception as e:
            self.message_user(request, f"An error occurred: {str(e)}", level=django_messages.ERROR)

    fetch_messages_from_gmail.short_description = "Fetch 10 emails from Gmail"

    def add_view(self, request, form_url='', extra_context=None):
        return self.connect_channel(request)
    
    def connect_channel(self, request):
        try:
            client_secret_file = os.path.expanduser(os.getenv('GMAIL_CLIENT_SECRET_FILE'))
            flow = Flow.from_client_secrets_file(
                client_secret_file,
                scopes=SCOPES,
                redirect_uri='http://localhost:8000/oauth2callback'
            )
            print("Requesting scopes:", SCOPES)  # Add this line
            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true'
            )

            request.session['state'] = state
            request.session['admin_redirect'] = reverse('admin:channels_channel_changelist')

            return redirect(authorization_url)

        except Exception as e:
            self.message_user(request, f"An error occurred while connecting the channel: {str(e)}", level=messages.ERROR)
            return redirect(reverse('admin:channels_channel_changelist'))

    connect_channel.short_description = "Connect the channel"

custom_admin_site.register(Channel, ChannelAdmin)

from django.shortcuts import redirect
from django.contrib import messages
from django.urls import reverse

def oauth2callback(request):
    state = request.session['state']
    admin_redirect = request.session.get('admin_redirect', reverse('admin:channels_channel_changelist'))

    flow = Flow.from_client_secrets_file(
        'google_api_secrets.json',
        scopes=SCOPES
    )
    flow.redirect_uri = 'http://localhost:8000/oauth2callback'

    authorization_response = request.build_absolute_uri()
    flow.fetch_token(authorization_response=authorization_response)

    credentials = flow.credentials
    
    # Get user info
    service = build('oauth2', 'v2', credentials=credentials)
    user_info = service.userinfo().get().execute()
    email = user_info['email']

    # Create or update Channel
    user, _ = User.objects.get_or_create(username=email)
    channel, created = Channel.objects.update_or_create(
        email=email,
        workspace_public_id="wks_94d425e52d18",
        defaults={'user': user}
    )

    if created:
        messages.success(request, f"Successfully connected channel for {email}!")
    else:
        messages.info(request, f"Updated existing channel connection for {email}.")

    # Clear session data
    request.session.pop('state', None)
    request.session.pop('admin_redirect', None)

    return redirect(admin_redirect)