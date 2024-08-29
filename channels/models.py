import logging
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
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


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
                redirect_uri='http://localhost:8000/oauth2callback'
            )
            auth_url, _ = flow.authorization_url(prompt='consent')
            
            logger.info(f"Please visit this URL to authorize the application: {auth_url}")
            authorization_code = input("Enter the authorization code: ")
            
            flow.fetch_token(code=authorization_code)
            creds = flow.credentials

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
                redirect_uri=request.build_absolute_uri(reverse('oauth2callback'))
            )
            auth_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'
            )
            
            logger.info(f"Authorization URL: {auth_url}")
            
            # Store necessary information in session
            request.session['oauth_state'] = state
            request.session['oauth_client_secret_file'] = client_secret_file

            # Redirect user to auth_url
            return redirect(auth_url)

        except Exception as e:
            logger.error(f"Error in connect_channel: {str(e)}", exc_info=True)
            self.message_user(request, f"An error occurred while connecting the channel: {str(e)}", level=django_messages.ERROR)
            return redirect(reverse('admin:channels_channel_changelist'))

custom_admin_site.register(Channel, ChannelAdmin)

from django.shortcuts import redirect
from django.contrib import messages
from django.urls import reverse

def oauth2callback(request):
    logger.debug(f"oauth2callback called with GET params: {request.GET}")
    
    try:
        state = request.session.get('oauth_state')
        client_secret_file = request.session.get('oauth_client_secret_file')

        if not state or not client_secret_file:
            raise ValueError("OAuth state or client secret file not found in session")

        flow = Flow.from_client_secrets_file(
            client_secret_file,
            scopes=SCOPES,
            state=state
        )
        flow.redirect_uri = request.build_absolute_uri(reverse('oauth2callback'))

        # Check if there's an error in the request
        if 'error' in request.GET:
            raise ValueError(f"Error in OAuth flow: {request.GET['error']}")

        # Check if there's a code in the request
        if 'code' not in request.GET:
            raise ValueError("No authorization code found in the request")

        # Exchange the authorization code for credentials
        flow.fetch_token(code=request.GET['code'])
        
        credentials = flow.credentials

        # Get user info
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        email = user_info['email']

        logger.info(f"Successfully authenticated user: {email}")

        # Create or update Channel
        from workspace_filter.models import User
        from channels.models import Channel
        
        user, _ = User.objects.get_or_create(username=email)
        channel, created = Channel.objects.update_or_create(
            email=email,
            workspace_public_id="wks_94d425e52d18",
            defaults={'user': user}
        )

        if created:
            logger.info(f"Successfully connected channel for {email}")
            messages.success(request, f"Successfully connected channel for {email}!")
        else:
            logger.info(f"Updated existing channel connection for {email}")
            messages.info(request, f"Updated existing channel connection for {email}.")

        # Clear session data
        request.session.pop('oauth_state', None)
        request.session.pop('oauth_client_secret_file', None)

    except Exception as e:
        logger.error(f"Error in oauth2callback: {str(e)}", exc_info=True)
        messages.error(request, f"An error occurred during OAuth: {str(e)}")

    return redirect(reverse('admin:channels_channel_changelist'))