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
    email = models.EmailField()

    def __str__(self):
        return self.email
    
    class Meta:
        unique_together = ['workspace_public_id', 'email']

SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'  # Add this for sending emails
]

def get_gmail_service():
    logger.info("Initializing Gmail service")
    load_dotenv()
    creds = None
    if os.path.exists('token.pickle'):
        logger.info("Loading credentials from token.pickle")
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            logger.info("Refreshing expired credentials")
            creds.refresh(Request())
        else:
            logger.info("Initiating new OAuth flow")
            client_secret_file = os.path.expanduser(os.getenv('GMAIL_CLIENT_SECRET_FILE'))
            flow = Flow.from_client_secrets_file(
                client_secret_file, 
                scopes=SCOPES,
                redirect_uri='http://localhost:8000/oauth2callback/'
            )
            auth_url, _ = flow.authorization_url(access_type='offline', include_granted_scopes='true')
            print(f"Please visit this URL to authorize the application: {auth_url}")
            code = input("Enter the authorization code: ")
            flow.fetch_token(code=code)
            creds = flow.credentials

        logger.info("Saving new credentials to token.pickle")
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    logger.info("Building Gmail service")
    service = build('gmail', 'v1', credentials=creds)
    return service

import logging

logger = logging.getLogger(__name__)


import base64

def fetch_messages_from_gmail(request):
    from chat_messages.models import Message
    from people.models import Person  
    logger.info("Starting to fetch messages from Gmail")
    try:
        service = get_gmail_service()
        logger.info("Gmail service initialized")

        results = service.users().messages().list(userId='me', maxResults=10).execute()
        logger.info(f"Retrieved {len(results.get('messages', []))} messages")

        messages = results.get('messages', [])

        if not messages:
            logger.warning("No messages found")
            return 0

        user, _ = User.objects.get_or_create(username='gmail_user')
        channel, _ = Channel.objects.get_or_create(user=user, email=user.email)
        person, _ = Person.objects.get_or_create(
            email=user.email,
            defaults={
                'first_name': 'Gmail',
                'last_name': 'User',
                'status': 'NEW',
                'source': 'Gmail Import'
            }
        )
        created_count = 0

        for message in messages:
            logger.debug(f"Processing message ID: {message['id']}")
            msg = service.users().messages().get(userId='me', id=message['id']).execute()
            
            subject = next((header['value'] for header in msg['payload']['headers'] if header['name'] == 'Subject'), 'No Subject')
            sender = next((header['value'] for header in msg['payload']['headers'] if header['name'] == 'From'), 'Unknown')
            
            body = ''
            if 'parts' in msg['payload']:
                for part in msg['payload']['parts']:
                    if part.get('body') and part['body'].get('data'):
                        body += base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
            elif msg['payload'].get('body') and msg['payload']['body'].get('data'):
                body = base64.urlsafe_b64decode(msg['payload']['body']['data']).decode('utf-8')
            else:
                body = msg.get('snippet', 'No body')

            try:
                Message.objects.create(
                    channel=channel,
                    recipient=person,
                    subject=subject[:255],
                    content=body,
                    timestamp=timezone.now(),
                    is_read=False,
                    workspace_public_id=request.environ.get('WORKSPACE_PUBLIC_ID')
                )
                created_count += 1
                logger.info(f"Created message: {subject[:30]}...")
            except Exception as e:
                logger.error(f"Failed to create message: {subject[:30]}... Error: {str(e)}")

        logger.info(f"Successfully created {created_count} messages")
        return created_count

    except Exception as e:
        logger.error(f"Error in fetch_messages_from_gmail: {str(e)}", exc_info=True)
        raise

import json
from urllib.parse import parse_qs, quote_plus, urlencode, urlparse, urlunparse

class ChannelAdmin(BaseAdmin):
    list_display = ('email', 'user')
    actions = ['fetch_messages_from_gmail']

    def fetch_messages_from_gmail(self, request, queryset):
        try:
            created_count = fetch_messages_from_gmail(request)
            self.message_user(request, f"{created_count} messages have been created from Gmail successfully.", level=django_messages.SUCCESS)
        except Exception as e:
            self.message_user(request, f"An error occurred: {str(e)}", level=django_messages.ERROR)

    fetch_messages_from_gmail.short_description = "Fetch 10 emails from Gmail"

    def add_view(self, request, form_url='', extra_context=None):
        return self.connect_channel(request)

    def connect_channel(self, request):
        try:
            client_secret_file = os.path.expanduser(os.getenv('GMAIL_CLIENT_SECRET_FILE'))
            
            # Get the workspace_public_id from the request
            workspace_public_id = request.environ["WORKSPACE_PUBLIC_ID"]
            
            # Create a redirect URI without the workspace_public_id
            redirect_uri = request.build_absolute_uri(reverse('oauth2callback')).replace(f'/{workspace_public_id}', '')
            print(f"redirect_uri: {redirect_uri}")
            flow = Flow.from_client_secrets_file(
                client_secret_file,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
            
            # Create a state parameter with the workspace_public_id
            state = f"{workspace_public_id}:{os.urandom(16).hex()}"
            
            auth_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent',
                state=state
            )

            # Store the client configuration in the session
            with open(client_secret_file, 'r') as f:
                client_config = json.load(f)

            request.session['oauth_client_config'] = client_config
            request.session['oauth_scopes'] = SCOPES
            request.session['oauth_redirect_uri'] = redirect_uri

            print(f"Please visit this URL to authorize the application: {auth_url}")
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
        # Recreate the flow using the stored configuration
        client_config = request.session.get('oauth_client_config')
        scopes = request.session.get('oauth_scopes')
        redirect_uri = request.session.get('oauth_redirect_uri')

        if not all([client_config, scopes, redirect_uri]):
            raise ValueError("Missing OAuth configuration in session")

        flow = Flow.from_client_config(
            client_config,
            scopes=scopes,
            redirect_uri=redirect_uri
        )

        # Check if there's an error in the request
        if 'error' in request.GET:
            raise ValueError(f"Error in OAuth flow: {request.GET['error']}")

        # Check if there's a code in the request
        if 'code' not in request.GET:
            raise ValueError("No authorization code found in the request")

        # Get the state parameter and extract the workspace_public_id
        state = request.GET.get('state', '')
        # workspace_public_id, _ = state.split(':', 1)
        # print(f"workspace_public_id: {workspace_public_id}")

        # Exchange the authorization code for credentials
        flow.fetch_token(code=request.GET['code'])

        credentials = flow.credentials

        # Save the credentials
        with open('token.pickle', 'wb') as token:
            pickle.dump(credentials, token)

        # Get user info
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        email = user_info['email']

        logger.info(f"Successfully authenticated user: {email}")

        # Create or update Channel
        user, _ = User.objects.get_or_create(username=email)
        channel, created = Channel.objects.update_or_create(
            email=email,
            workspace_public_id=request.environ['WORKSPACE_PUBLIC_ID'],
            defaults={'user': user}
        )

        if created:
            logger.info(f"Successfully connected channel for {email}")
            messages.success(request, f"Successfully connected channel for {email}!")
        else:
            logger.info(f"Updated existing channel connection for {email}")
            messages.info(request, f"Updated existing channel connection for {email}.")

        # Clear session data
        for key in ['oauth_client_config', 'oauth_scopes', 'oauth_redirect_uri']:
            request.session.pop(key, None)

    except Exception as e:
        logger.error(f"Error in oauth2callback: {str(e)}", exc_info=True)
        messages.error(request, f"An error occurred during OAuth: {str(e)}")

    return redirect(reverse('admin:channels_channel_changelist'))