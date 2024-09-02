import base64
import json
import logging
import os
import pickle

from google.api_core import exceptions as google_exceptions
from google.auth.transport.requests import Request
from google.cloud import pubsub_v1
from google.oauth2 import service_account
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from base_model.models import BaseModel
from base_model_admin.models import BaseAdmin
from custom_user.models import User
from django.contrib import messages
from django.contrib import messages as django_messages
from django.db import models
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import re_path, reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from people.models import Person
from workspaces.models import Workspace

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def get_pubsub_credentials():
    return service_account.Credentials.from_service_account_file(
        "google_backend_service_account.json",
        scopes=["https://www.googleapis.com/auth/pubsub"],
    )


class Channel(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField()
    gmail_history_id = models.CharField(max_length=20, blank=True, null=True)
    gmail_expiration = models.CharField(max_length=20, blank=True, null=True)
    last_synced = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.email

    class Meta:
        unique_together = ["workspace", "email"]


SCOPES = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.settings.basic",
    "https://www.googleapis.com/auth/pubsub",  # Add this line
]


def setup_pubsub_topic():
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT_ID")
    topic_id = "gmail-notifications"

    credentials = get_pubsub_credentials()
    publisher = pubsub_v1.PublisherClient(credentials=credentials)
    topic_path = publisher.topic_path(project_id, topic_id)

    try:
        topic = publisher.create_topic(request={"name": topic_path})
        logger.info(f"Created PubSub topic: {topic.name}")
    except google_exceptions.AlreadyExists:
        logger.info(f"PubSub topic already exists: {topic_path}")
    except Exception as e:
        logger.error(f"Error creating PubSub topic: {str(e)}")
        raise


def get_gmail_service():
    logger.info("Initializing Gmail service")
    creds = None
    if os.path.exists("token.pickle"):
        logger.info("Loading credentials from token.pickle")
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            logger.info("Refreshing expired credentials")
            creds.refresh(Request())
        else:
            logger.info("Initiating new OAuth flow")
            client_secret_file = os.path.expanduser(
                os.getenv("GMAIL_CLIENT_SECRET_FILE")
            )
            flow = Flow.from_client_secrets_file(
                client_secret_file,
                scopes=SCOPES,
                redirect_uri="https://green.bluewind.ai/oauth2callback/",
            )
            auth_url, _ = flow.authorization_url(
                access_type="offline", include_granted_scopes="true"
            )
            print(f"Please visit this URL to authorize the application: {auth_url}")
            code = input("Enter the authorization code: ")
            flow.fetch_token(code=code)
            creds = flow.credentials

        logger.info("Saving new credentials to token.pickle")
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)

    logger.info("Building Gmail service")
    if creds:
        logger.info(f"Gmail credentials type: {type(creds)}")
        logger.info(f"Gmail credentials scopes: {creds.scopes}")

    service = build("gmail", "v1", credentials=creds)
    return service


def fetch_messages_from_gmail(request, channel):
    from chat_messages.models import Message

    logger.info(f"Starting to fetch messages from Gmail for channel: {channel.email}")
    try:
        service = get_gmail_service()
        logger.info("Gmail service initialized")

        results = service.users().messages().list(userId="me", maxResults=10).execute()
        logger.info(f"Retrieved {len(results.get('messages', []))} messages")

        messages = results.get("messages", [])

        if not messages:
            logger.warning("No messages found")
            return 0

        # Use get_or_create with both email and workspace
        person, created = Person.objects.get_or_create(
            email=channel.email,
            workspace=channel.workspace,
            defaults={
                "first_name": "Gmail",
                "last_name": "User",
                "status": "NEW",
                "source": "Gmail Import",
            },
        )

        if created:
            logger.info(f"Created new Person for email: {channel.email}")
        else:
            logger.info(f"Found existing Person for email: {channel.email}")

        created_count = 0

        for message in messages:
            logger.debug(f"Processing message ID: {message['id']}")
            msg = (
                service.users().messages().get(userId="me", id=message["id"]).execute()
            )

            subject = next(
                (
                    header["value"]
                    for header in msg["payload"]["headers"]
                    if header["name"] == "Subject"
                ),
                "No Subject",
            )

            body = ""
            if "parts" in msg["payload"]:
                for part in msg["payload"]["parts"]:
                    if part.get("body") and part["body"].get("data"):
                        body += base64.urlsafe_b64decode(part["body"]["data"]).decode(
                            "utf-8"
                        )
            elif msg["payload"].get("body") and msg["payload"]["body"].get("data"):
                body = base64.urlsafe_b64decode(msg["payload"]["body"]["data"]).decode(
                    "utf-8"
                )
            else:
                body = msg.get("snippet", "No body")

            try:
                Message.objects.create(
                    channel=channel,
                    recipient=person,
                    subject=subject[:255],
                    content=body,
                    timestamp=timezone.now(),
                    is_read=False,
                    workspace=Workspace.objects.get(
                        public_id=request.environ["WORKSPACE_PUBLIC_ID"]
                    ),
                    gmail_message_id=message["id"],
                )
                created_count += 1
                logger.info(f"Created message: {subject[:30]}...")
            except Exception as e:
                logger.error(
                    f"Failed to create message: {subject[:30]}... Error: {str(e)}"
                )

        logger.info(
            f"Successfully created {created_count} messages for {channel.email}"
        )
        return created_count

    except Exception as e:
        logger.error(
            f"Error in fetch_messages_from_gmail for {channel.email}: {str(e)}",
            exc_info=True,
        )
        raise


class ChannelAdmin(BaseAdmin):
    list_display = ("email", "user")
    actions = ["fetch_messages_from_gmail", "setup_gmail_push_notifications"]
    readonly_fields = ("gmail_history_id", "gmail_expiration", "last_synced")

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            re_path(
                r"^gmail-webhook/(?P<channel_id>[\w-]+)/$",
                self.admin_site.admin_view(self.gmail_webhook),
                name="channel_gmail_webhook",
            ),
        ]
        return custom_urls + urls

    @csrf_exempt
    @require_POST
    def gmail_webhook(self, request, channel_id):
        channel = get_object_or_404(Channel, id=channel_id)
        # Process the notification
        # Update channel.last_synced or other relevant fields
        channel.save()
        return HttpResponse("Webhook received", status=200)

    def setup_gmail_push_notifications(self, request, queryset):
        # Ensure PubSub topic is set up first
        try:
            setup_pubsub_topic()
        except Exception as e:
            self.message_user(
                request,
                f"Error setting up PubSub topic: {str(e)}",
                level=django_messages.ERROR,
            )
            return

        for channel in queryset:
            try:
                gmail_service = get_gmail_service()

                request_body = {
                    "labelIds": ["INBOX"],
                    "topicName": f"projects/{os.environ['GOOGLE_CLOUD_PROJECT_ID']}/topics/gmail-notifications",
                    "labelFilterAction": "include",
                }

                watch_response = (
                    gmail_service.users()
                    .watch(userId="me", body=request_body)
                    .execute()
                )

                channel.gmail_history_id = watch_response["historyId"]
                channel.gmail_expiration = watch_response["expiration"]
                channel.save()

                self.message_user(
                    request,
                    f"Successfully set up push notifications for {channel.email}",
                    level=django_messages.SUCCESS,
                )
            except Exception as e:
                logger.error(
                    f"Detailed error for {channel.email}: {str(e)}", exc_info=True
                )
                self.message_user(
                    request,
                    f"Error setting up push notifications for {channel.email}: {str(e)}",
                    level=django_messages.ERROR,
                )

    setup_gmail_push_notifications.short_description = "Set up Gmail push notifications"

    def fetch_messages_from_gmail(self, request, queryset):
        total_created_count = 0
        for channel in queryset:
            try:
                created_count = fetch_messages_from_gmail(request, channel)
                total_created_count += created_count
                self.message_user(
                    request,
                    f"Created {created_count} messages for {channel.email}",
                    level=django_messages.SUCCESS,
                )
            except Exception as e:
                self.message_user(
                    request,
                    f"Error fetching messages for {channel.email}: {str(e)}",
                    level=django_messages.ERROR,
                )

        self.message_user(
            request,
            f"Total messages created: {total_created_count}",
            level=django_messages.INFO,
        )

    fetch_messages_from_gmail.short_description = "Fetch 10 emails from Gmail"

    def add_view(self, request, form_url="", extra_context=None):
        return self.connect_channel(request)

    def connect_channel(self, request):
        try:
            client_secret_file = os.path.expanduser(
                os.getenv("GMAIL_CLIENT_SECRET_FILE")
            )

            workspace_public_id = request.environ["WORKSPACE_PUBLIC_ID"]

            redirect_uri = request.build_absolute_uri(
                reverse("oauth2callback")
            ).replace(f"/{workspace_public_id}", "")
            print(f"redirect_uri: {redirect_uri}")
            flow = Flow.from_client_secrets_file(
                client_secret_file, scopes=SCOPES, redirect_uri=redirect_uri
            )

            state = f"{workspace_public_id}:{os.urandom(16).hex()}"

            auth_url, _ = flow.authorization_url(
                access_type="offline",
                include_granted_scopes="true",
                prompt="consent",
                state=state,
            )

            with open(client_secret_file, "r") as f:
                client_config = json.load(f)

            request.session["oauth_client_config"] = client_config
            request.session["oauth_scopes"] = SCOPES
            request.session["oauth_redirect_uri"] = redirect_uri

            print(f"Please visit this URL to authorize the application: {auth_url}")
            return redirect(auth_url)

        except Exception as e:
            logger.error(f"Error in connect_channel: {str(e)}", exc_info=True)
            self.message_user(
                request,
                f"An error occurred while connecting the channel: {str(e)}",
                level=django_messages.ERROR,
            )
            return redirect(reverse("admin:channels_channel_changelist"))


def oauth2callback(request):
    logger.debug(f"oauth2callback called with GET params: {request.GET}")

    try:
        client_config = request.session.get("oauth_client_config")
        scopes = request.session.get("oauth_scopes")
        redirect_uri = request.session.get("oauth_redirect_uri")

        if not all([client_config, scopes, redirect_uri]):
            raise ValueError("Missing OAuth configuration in session")

        flow = Flow.from_client_config(
            client_config, scopes=scopes, redirect_uri=redirect_uri
        )

        if "error" in request.GET:
            raise ValueError(f"Error in OAuth flow: {request.GET['error']}")

        if "code" not in request.GET:
            raise ValueError("No authorization code found in the request")

        flow.fetch_token(code=request.GET["code"])

        credentials = flow.credentials

        with open("token.pickle", "wb") as token:
            pickle.dump(credentials, token)

        service = build("oauth2", "v2", credentials=credentials)
        user_info = service.userinfo().get().execute()
        email = user_info["email"]

        logger.info(f"Successfully authenticated user: {email}")

        user = request.user

        channel, created = Channel.objects.update_or_create(
            email=email,
            workspace=Workspace.objects.get(
                public_id=request.environ["WORKSPACE_PUBLIC_ID"]
            ),
            defaults={"user": user},
        )

        if created:
            logger.info(f"Successfully connected channel for {email}")
            messages.success(request, f"Successfully connected channel for {email}!")
        else:
            logger.info(f"Updated existing channel connection for {email}")
            messages.info(request, f"Updated existing channel connection for {email}.")

        try:
            gmail_service = build("gmail", "v1", credentials=credentials)
            request_body = {
                "labelIds": ["INBOX"],
                "topicName": f"projects/{os.environ['GOOGLE_CLOUD_PROJECT_ID']}/topics/gmail-notifications",
                "labelFilterAction": "include",
            }
            watch_response = (
                gmail_service.users().watch(userId="me", body=request_body).execute()
            )

            channel.gmail_history_id = watch_response["historyId"]
            channel.gmail_expiration = watch_response["expiration"]
            channel.save()

            logger.info(f"Successfully set up push notifications for {email}")
            messages.success(
                request, f"Successfully set up push notifications for {email}!"
            )
        except Exception as e:
            logger.error(
                f"Error setting up push notifications for {email}: {str(e)}",
                exc_info=True,
            )
            messages.warning(
                request,
                f"Channel connected, but failed to set up push notifications: {str(e)}",
            )

        for key in ["oauth_client_config", "oauth_scopes", "oauth_redirect_uri"]:
            request.session.pop(key, None)

    except Exception as e:
        logger.error(f"Error in oauth2callback: {str(e)}", exc_info=True)
        messages.error(request, f"An error occurred during OAuth: {str(e)}")

    return redirect(reverse("admin:channels_channel_changelist"))
