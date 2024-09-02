import base64
import json
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from base_model_admin.models import BaseAdmin
from custom_user.models import User
from django.contrib import messages
from django.db import models
from django.http import HttpResponseBadRequest, HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from people.models import Person
from workspaces.models import Workspace, WorkspaceRelated

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


class Channel(WorkspaceRelated):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField()
    access_token = models.TextField(null=True, blank=True)
    refresh_token = models.TextField(null=True, blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    client_id = models.TextField(null=True, blank=True)
    client_secret = models.TextField(null=True, blank=True)

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
    "https://www.googleapis.com/auth/pubsub",
]


def get_gmail_service(channel):
    creds = None
    if channel.access_token and channel.refresh_token:
        creds = Credentials.from_authorized_user_info(
            {
                "access_token": channel.access_token,
                "refresh_token": channel.refresh_token,
                "token_expiry": channel.token_expiry.isoformat()
                if channel.token_expiry
                else None,
                "scopes": SCOPES,
                "client_id": channel.client_id,
                "client_secret": channel.client_secret,
            }
        )

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            channel.access_token = creds.token
            channel.token_expiry = creds.expiry
            channel.save()
        else:
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
            code = input("Enter the authorization code: ")
            flow.fetch_token(code=code)
            creds = flow.credentials

            channel.access_token = creds.token
            channel.refresh_token = creds.refresh_token
            channel.token_expiry = creds.expiry
            channel.client_id = creds.client_id
            channel.client_secret = creds.client_secret
            channel.save()

    return build("gmail", "v1", credentials=creds)


def fetch_messages_from_gmail(request, channel):
    from chat_messages.models import Message

    service = get_gmail_service(channel)
    results = service.users().messages().list(userId="me", maxResults=10).execute()
    messages = results.get("messages", [])

    if not messages:
        return 0

    person, _ = Person.objects.get_or_create(
        email=channel.email,
        workspace=channel.workspace,
        defaults={
            "first_name": "Gmail",
            "last_name": "User",
            "status": "NEW",
            "source": "Gmail Import",
        },
    )

    created_count = 0

    for message in messages:
        msg = service.users().messages().get(userId="me", id=message["id"]).execute()

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

    return created_count


class ChannelAdmin(BaseAdmin):
    list_display = ("email", "user")
    actions = [
        "fetch_messages_from_gmail",
    ]

    def fetch_messages_from_gmail(self, request, queryset):
        total_created_count = 0
        for channel in queryset:
            created_count = fetch_messages_from_gmail(request, channel)
            total_created_count += created_count
            self.message_user(
                request,
                f"Created {created_count} messages for {channel.email}",
                level=messages.SUCCESS,
            )

        self.message_user(
            request,
            f"Total messages created: {total_created_count}",
            level=messages.INFO,
        )

    fetch_messages_from_gmail.short_description = "Fetch 10 emails from Gmail"

    def add_view(self, request, form_url="", extra_context=None):
        return self.connect_channel(request)

    def connect_channel(self, request):
        client_secret_file = os.path.expanduser(os.getenv("GMAIL_CLIENT_SECRET_FILE"))
        workspace_public_id = request.environ["WORKSPACE_PUBLIC_ID"]
        redirect_uri = request.build_absolute_uri(reverse("oauth2callback")).replace(
            f"/{workspace_public_id}", ""
        )

        flow = Flow.from_client_secrets_file(
            client_secret_file, scopes=SCOPES, redirect_uri=redirect_uri
        )

        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=f"{workspace_public_id}:{os.urandom(16).hex()}",
        )

        with open(client_secret_file, "r") as f:
            client_config = json.load(f)

        request.session["oauth_client_config"] = client_config
        request.session["oauth_scopes"] = SCOPES
        request.session["oauth_redirect_uri"] = redirect_uri

        return redirect(auth_url)


def oauth2callback(request):
    try:
        client_config = request.session.get("oauth_client_config")
        scopes = request.session.get("oauth_scopes")
        redirect_uri = request.session.get("oauth_redirect_uri")

        if not all([client_config, scopes, redirect_uri]):
            return HttpResponseBadRequest("Missing OAuth configuration in session")

        flow = Flow.from_client_config(
            client_config, scopes=scopes, redirect_uri=redirect_uri
        )

        # Fetch the authorization code from the request
        authorization_response = request.build_absolute_uri()
        flow.fetch_token(authorization_response=authorization_response)
        credentials = flow.credentials

        service = build("oauth2", "v2", credentials=credentials)
        user_info = service.userinfo().get().execute()
        email = user_info["email"]

        workspace_public_id = request.environ.get("WORKSPACE_PUBLIC_ID")
        if not workspace_public_id:
            return HttpResponseBadRequest("Missing workspace public ID")

        workspace = Workspace.objects.get(public_id=workspace_public_id)

        channel, created = Channel.objects.update_or_create(
            email=email,
            workspace=workspace,
            defaults={
                "user": request.user,
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_expiry": credentials.expiry,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
            },
        )

        if created:
            messages.success(request, f"Successfully connected channel for {email}!")
        else:
            messages.info(request, f"Updated existing channel connection for {email}.")

        for key in ["oauth_client_config", "oauth_scopes", "oauth_redirect_uri"]:
            request.session.pop(key, None)

        return HttpResponseRedirect(reverse("admin:channels_channel_changelist"))

    except Exception as e:
        # Log the exception for debugging
        import logging

        logging.exception("Error in oauth2callback")
        messages.error(request, f"An error occurred: {str(e)}")
        return HttpResponseRedirect(reverse("admin:channels_channel_changelist"))
