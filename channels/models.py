import os
import base64
import pickle
import json
from django.db import models
from django.shortcuts import redirect
from django.utils import timezone
from django.urls import reverse
from django.contrib import messages

from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import Flow

from base_model_admin.models import BaseAdmin
from base_model.models import BaseModel
from workspace_filter.models import User
from workspaces.models import Workspace, custom_admin_site
from people.models import Person

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

class Channel(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField()

    def __str__(self):
        return self.email

    class Meta:
        unique_together = ['workspace', 'email']

SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.settings.basic',
    'https://www.googleapis.com/auth/pubsub',  # Added this line back
]

def get_gmail_service():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            client_secret_file = os.path.expanduser(os.getenv('GMAIL_CLIENT_SECRET_FILE'))
            flow = Flow.from_client_secrets_file(
                client_secret_file, 
                scopes=SCOPES,
                redirect_uri='https://green.bluewind.ai/oauth2callback/'
            )
            auth_url, _ = flow.authorization_url(access_type='offline', include_granted_scopes='true')
            code = input("Enter the authorization code: ")
            flow.fetch_token(code=code)
            creds = flow.credentials

        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return build('gmail', 'v1', credentials=creds)

def fetch_messages_from_gmail(request, channel):
    from chat_messages.models import Message

    service = get_gmail_service()
    results = service.users().messages().list(userId='me', maxResults=10).execute()
    messages = results.get('messages', [])

    if not messages:
        return 0

    person, _ = Person.objects.get_or_create(
        email=channel.email,
        workspace=channel.workspace,
        defaults={
            'first_name': 'Gmail',
            'last_name': 'User',
            'status': 'NEW',
            'source': 'Gmail Import',
        }
    )

    created_count = 0

    for message in messages:
        msg = service.users().messages().get(userId='me', id=message['id']).execute()

        subject = next((header['value'] for header in msg['payload']['headers'] if header['name'] == 'Subject'), 'No Subject')

        body = ''
        if 'parts' in msg['payload']:
            for part in msg['payload']['parts']:
                if part.get('body') and part['body'].get('data'):
                    body += base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
        elif msg['payload'].get('body') and msg['payload']['body'].get('data'):
            body = base64.urlsafe_b64decode(msg['payload']['body']['data']).decode('utf-8')
        else:
            body = msg.get('snippet', 'No body')

        Message.objects.create(
            channel=channel,
            recipient=person,
            subject=subject[:255],
            content=body,
            timestamp=timezone.now(),
            is_read=False,
            workspace=Workspace.objects.get(public_id=request.environ['WORKSPACE_PUBLIC_ID']),
            gmail_message_id=message['id']
        )
        created_count += 1

    return created_count

class ChannelAdmin(BaseAdmin):
    list_display = ('email', 'user')
    actions = ['fetch_messages_from_gmail',]

    def fetch_messages_from_gmail(self, request, queryset):
        total_created_count = 0
        for channel in queryset:
            created_count = fetch_messages_from_gmail(request, channel)
            total_created_count += created_count
            self.message_user(request, f"Created {created_count} messages for {channel.email}", level=messages.SUCCESS)

        self.message_user(request, f"Total messages created: {total_created_count}", level=messages.INFO)

    fetch_messages_from_gmail.short_description = "Fetch 10 emails from Gmail"

    def add_view(self, request, form_url='', extra_context=None):
        return self.connect_channel(request)

    def connect_channel(self, request):
        client_secret_file = os.path.expanduser(os.getenv('GMAIL_CLIENT_SECRET_FILE'))
        workspace_public_id = request.environ["WORKSPACE_PUBLIC_ID"]
        redirect_uri = request.build_absolute_uri(reverse('oauth2callback')).replace(f'/{workspace_public_id}', '')
        
        flow = Flow.from_client_secrets_file(
            client_secret_file,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )

        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=f"{workspace_public_id}:{os.urandom(16).hex()}"
        )

        with open(client_secret_file, 'r') as f:
            client_config = json.load(f)

        request.session['oauth_client_config'] = client_config
        request.session['oauth_scopes'] = SCOPES
        request.session['oauth_redirect_uri'] = redirect_uri

        return redirect(auth_url)

custom_admin_site.register(Channel, ChannelAdmin)

def oauth2callback(request):
    client_config = request.session.get('oauth_client_config')
    scopes = request.session.get('oauth_scopes')
    redirect_uri = request.session.get('oauth_redirect_uri')

    flow = Flow.from_client_config(
        client_config,
        scopes=scopes,
        redirect_uri=redirect_uri
    )

    flow.fetch_token(code=request.GET['code'])
    credentials = flow.credentials

    with open('token.pickle', 'wb') as token:
        pickle.dump(credentials, token)

    service = build('oauth2', 'v2', credentials=credentials)
    user_info = service.userinfo().get().execute()
    email = user_info['email']

    channel, created = Channel.objects.update_or_create(
        email=email,
        workspace=Workspace.objects.get(public_id=request.environ['WORKSPACE_PUBLIC_ID']),
        defaults={'user': request.user}
    )

    if created:
        messages.success(request, f"Successfully connected channel for {email}!")
    else:
        messages.info(request, f"Updated existing channel connection for {email}.")

    for key in ['oauth_client_config', 'oauth_scopes', 'oauth_redirect_uri']:
        request.session.pop(key, None)

    return redirect(reverse('admin:channels_channel_changelist'))