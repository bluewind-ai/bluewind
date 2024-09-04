import base64
import json
import os

from encrypted_fields.fields import EncryptedCharField
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from base_model_admin.admin import InWorkspace
from bluewind import logger
from credentials.models import Credentials as CredentialsModel
from django import forms
from django.contrib import admin, messages
from django.db import models
from django.http import HttpResponseBadRequest, HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from gmail_subscriptions.models import GmailSubscription
from people.models import Person
from users.models import User
from workspaces.models import WorkspaceRelated

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


class Channel(WorkspaceRelated):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField()
    access_token = EncryptedCharField(max_length=1000, null=True, blank=True)
    refresh_token = EncryptedCharField(max_length=1000, null=True, blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    client_id = EncryptedCharField(max_length=1000, null=True, blank=True)
    client_secret = EncryptedCharField(max_length=1000, null=True, blank=True)
    last_history_id = models.TextField(null=True, blank=True)
    watch_expiration = models.DateTimeField(null=True, blank=True)

    # New field to reference GmailSubscription
    gmail_subscription = models.ForeignKey(
        GmailSubscription, on_delete=models.CASCADE, null=True, blank=True
    )

    gmail_credentials = models.ForeignKey(CredentialsModel, on_delete=models.CASCADE)

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
            credential = CredentialsModel.objects.get(
                workspace=channel.workspace, key="GMAIL_CLIENT_SECRET_BASE64"
            )
            client_secret_base64 = credential.value

            client_secret_json = base64.b64decode(client_secret_base64).decode("utf-8")
            client_secret_data = json.loads(client_secret_json)

            flow = Flow.from_client_config(
                client_secret_data,
                scopes=SCOPES,
                redirect_uri="https://green.bluewind.ai/oauth2callback/",
            )
            auth_url, _ = flow.authorization_url(
                access_type="offline", include_granted_scopes="true"
            )
            code = input(
                "Enter the authorization code: "
            )  # Note: This might need adjustment for your use case
            flow.fetch_token(code=code)
            creds = flow.credentials

            channel.access_token = creds.token
            channel.refresh_token = creds.refresh_token
            channel.token_expiry = creds.expiry
            channel.client_id = creds.client_id
            channel.client_secret = creds.client_secret
            channel.save()

    return build("gmail", "v1", credentials=creds)


def setup_gmail_watch(channel):
    service = get_gmail_service(channel)

    from channels.models import PubSubTopic

    pubsub_topic = PubSubTopic.objects.get(workspace=channel.workspace)
    topic_name = f"projects/{pubsub_topic.project_id}/topics/{pubsub_topic.topic_id}"

    result = (
        service.users()
        .watch(
            userId="me",
            body={
                "topicName": topic_name,
                "labelIds": ["INBOX"],
            },
        )
        .execute()
    )

    logger.info(f"Watch setup result: {result}")

    # Store the historyId and expiration
    channel.last_history_id = result["historyId"]
    channel.watch_expiration = timezone.now() + timezone.timedelta(days=7)
    channel.save()

    logger.info(
        f"Updated channel {channel.id} with historyId: {channel.last_history_id}"
    )
    return True


def renew_gmail_watch(channel):
    if (
        channel.watch_expiration
        and channel.watch_expiration - timezone.now() < timezone.timedelta(days=1)
    ):
        return setup_gmail_watch(channel)
    return True


class ConnectGmailForm(forms.ModelForm):
    class Meta:
        model = Channel
        fields = ["gmail_credentials", "user", "workspace"]


def fetch_messages_from_gmail(channel, history_id=None, max_results=10):
    from chat_messages.models import Message

    logger.info(f"Fetching messages for channel {channel.id}, history_id: {history_id}")

    service = get_gmail_service(channel)

    renew_gmail_watch(channel)

    messages = []

    if history_id:
        try:
            results = (
                service.users()
                .history()
                .list(userId="me", startHistoryId=history_id)
                .execute()
            )

            if "history" not in results:
                logger.info(
                    f"No new changes since history ID {history_id} for {channel.email}"
                )
                return 0  # No new messages to process

            for history in results["history"]:
                if "messages" in history:
                    messages.extend(history["messages"])
        except HttpError as error:
            logger.error(f"An error occurred for {channel.email}: {error}")
            if error.resp.status == 404:
                logger.warning(
                    f"History ID {history_id} not found for {channel.email}. Fetching latest messages instead."
                )
                history_id = None  # Reset history_id to fetch latest messages
            else:
                raise  # Re-raise the exception for other types of errors

    if not history_id:
        logger.warning(
            f"No history_id provided for channel {channel.id}. Fetching recent messages."
        )
        try:
            results = (
                service.users()
                .messages()
                .list(userId="me", maxResults=max_results)
                .execute()
            )
            messages = results.get("messages", [])
        except HttpError as error:
            logger.error(f"Error fetching messages for {channel.email}: {error}")
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
        try:
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
                    if part["body"].get("data"):
                        body += base64.urlsafe_b64decode(part["body"]["data"]).decode(
                            "utf-8"
                        )
            elif msg["payload"]["body"].get("data"):
                body = base64.urlsafe_b64decode(msg["payload"]["body"]["data"]).decode(
                    "utf-8"
                )
            else:
                body = msg["snippet"]

            Message.objects.create(
                channel=channel,
                recipient=person,
                subject=subject[:255],
                content=body,
                timestamp=timezone.now(),
                is_read=False,
                workspace=channel.workspace,
                gmail_message_id=message["id"],
            )
            created_count += 1
        except Exception as e:
            logger.error(
                f"Error processing message {message['id']} for {channel.email}: {str(e)}"
            )

    logger.info(f"Processed {created_count} messages for {channel.email}")
    return created_count


class ChannelAdmin(InWorkspace):
    actions = ["fetch_messages_from_gmail", "connect_to_gmail"]

    def fetch_messages_from_gmail(self, request, queryset):
        total_created_count = 0
        for channel in queryset:
            created_count = fetch_messages_from_gmail(channel)
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

    @admin.action(description="Connect selected channels to Gmail")
    def connect_to_gmail(self, request, queryset):
        for channel in queryset:
            try:
                return self.initiate_oauth_flow(request, channel)
            except Exception as e:
                self.message_user(
                    request,
                    f"Failed to connect {channel.email} to Gmail: {str(e)}",
                    level=messages.ERROR,
                )

        self.message_user(
            request,
            "No channels were successfully connected to Gmail.",
            level=messages.WARNING,
        )

    def initiate_oauth_flow(self, request, channel):
        credential = CredentialsModel.objects.get(
            workspace=channel.workspace, key="GMAIL_CLIENT_SECRET_BASE64"
        )
        client_secret_base64 = credential.value
        client_secret_json = base64.b64decode(client_secret_base64).decode("utf-8")
        client_secret_data = json.loads(client_secret_json)

        # Construct the redirect URI using the current request
        redirect_uri = request.build_absolute_uri("/oauth2callback/")

        # Remove the workspace from the redirect URI
        redirect_uri = redirect_uri.replace("/workspaces/1", "")

        flow = Flow.from_client_config(
            client_secret_data,
            scopes=SCOPES,
            redirect_uri=redirect_uri,
        )

        # Include the workspace_id in the state
        state = f"workspaces/{channel.workspace_id}:{flow._generate_state()}"

        authorization_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=state,
        )

        request.session["oauth_state"] = state
        request.session["channel_id"] = channel.id

        return HttpResponseRedirect(authorization_url)

    fetch_messages_from_gmail.short_description = "Fetch 10 emails from Gmail"

    def add_view(self, request, form_url="", extra_context=None):
        self.form = ConnectGmailForm
        extra_context = extra_context or {}
        extra_context["title"] = "Connect Gmail Account"
        return super().add_view(request, form_url, extra_context)

    # def response_add(self, request, obj, post_url_continue=None):
    #     # obj is the newly created Channel instance
    #     return self.initiate_oauth_flow(request, obj)

    def initiate_oauth_flow(self, request, channel):
        credential = CredentialsModel.objects.get(
            workspace=channel.workspace, key="GMAIL_CLIENT_SECRET_BASE64"
        )
        client_secret_base64 = credential.value
        client_secret_json = base64.b64decode(client_secret_base64).decode("utf-8")
        client_secret_data = json.loads(client_secret_json)

        flow = Flow.from_client_config(
            client_secret_data,
            scopes=SCOPES,
            redirect_uri=request.build_absolute_uri(reverse("oauth2callback")),
        )

        authorization_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )

        request.session["oauth_state"] = state
        request.session["channel_id"] = channel.id

        return HttpResponseRedirect(authorization_url)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        # success = setup_gmail_watch(obj)
        # if success:
        #     self.message_user(
        #         request,
        #         f"Successfully set up Gmail watch for {obj.email}",
        #         level=messages.SUCCESS,
        #     )
        # else:
        #     self.message_user(
        #         request,
        #         f"Failed to set up Gmail watch for {obj.email}",
        #         level=messages.ERROR,
        #     )


def oauth2callback(request):
    state = request.GET.get("state")
    if not state or ":" not in state:
        return HttpResponseBadRequest("Invalid state parameter")

    workspace_part, oauth_state = state.split(":", 1)
    if not workspace_part.startswith("workspaces/"):
        return HttpResponseBadRequest("Invalid state format")

    workspace_id = workspace_part.split("/", 1)[1]
    channel_id = request.session.get("channel_id")

    if not channel_id:
        return HttpResponseBadRequest("Invalid session state")

    channel = Channel.objects.get(id=channel_id, workspace_id=workspace_id)

    credential = CredentialsModel.objects.get(
        workspace_id=workspace_id, key="GMAIL_CLIENT_SECRET_BASE64"
    )
    client_secret_base64 = credential.value
    client_secret_json = base64.b64decode(client_secret_base64).decode("utf-8")
    client_secret_data = json.loads(client_secret_json)

    flow = Flow.from_client_config(
        client_secret_data,
        scopes=SCOPES,
        state=oauth_state,
        redirect_uri=request.build_absolute_uri(reverse("oauth2callback")),
    )

    flow.fetch_token(authorization_response=request.build_absolute_uri())
    credentials = flow.credentials

    channel.access_token = credentials.token
    channel.refresh_token = credentials.refresh_token
    channel.token_expiry = credentials.expiry
    channel.client_id = credentials.client_id
    channel.client_secret = credentials.client_secret
    channel.save()

    messages.success(request, f"Successfully connected Gmail for {channel.email}")
    return redirect("admin:channels_channel_changelist")
