import base64
import json
import logging

from django.contrib import messages as django_messages
from django.core.exceptions import ValidationError
from django.db import models
from google.api_core import exceptions as google_exceptions
from google.cloud import pubsub_v1
from google.oauth2 import service_account

from base_model_admin.admin import InWorkspace
from credentials.models import Credentials
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class PubSubTopic(WorkspaceRelated):
    project_id = models.CharField(max_length=100)
    topic_id = models.CharField(max_length=100)

    @property
    def full_topic_name(self):
        return f"projects/{self.project_id}/topics/{self.topic_id}"

    def __str__(self):
        return f"{self.topic_id} in {self.project_id}"

    class Meta:
        unique_together = ["project_id", "topic_id"]


class GmailSubscription(WorkspaceRelated):
    topic = models.ForeignKey(PubSubTopic, on_delete=models.CASCADE)
    push_endpoint = models.URLField()

    def __str__(self):
        return f"Subscription for {self.topic} to {self.push_endpoint}"


def get_pubsub_credentials(workspace):
    try:
        credential = Credentials.objects.get(
            workspace=workspace, key="GOOGLE_SERVICE_ACCOUNT_BASE64"
        )
    except Credentials.DoesNotExist:
        raise ValidationError(
            "Google service account credentials not found for this workspace."
        )

    try:
        decoded_value = base64.b64decode(credential.value).decode("utf-8")
        service_account_info = json.loads(decoded_value)
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Error decoding service account info: {str(e)}")
        raise ValidationError("Invalid Google service account credentials format.")

    try:
        return service_account.Credentials.from_service_account_info(
            service_account_info,
            scopes=["https://www.googleapis.com/auth/pubsub"],
        )
    except ValueError as e:
        logger.error(f"Error creating service account credentials: {str(e)}")
        raise ValidationError("Invalid Google service account credentials.")


def setup_pubsub_topic(workspace, project_id, topic_id):
    credentials = get_pubsub_credentials(workspace)
    publisher = pubsub_v1.PublisherClient(credentials=credentials)
    topic_path = publisher.topic_path(project_id, topic_id)

    try:
        topic = publisher.create_topic(request={"name": topic_path})
        logger.info(f"Created PubSub topic: {topic.name}")
    except google_exceptions.AlreadyExists:
        logger.info(f"PubSub topic already exists: {topic_path}")
    except Exception as e:
        logger.error(f"Error creating PubSub topic: {str(e)}")
        raise ValidationError(f"Failed to create PubSub topic: {str(e)}")


def create_push_subscription(
    workspace, project_id, topic_id, subscription_id, endpoint
):
    subscriber = pubsub_v1.SubscriberClient(
        credentials=get_pubsub_credentials(workspace)
    )
    topic_path = subscriber.topic_path(project_id, topic_id)
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    push_config = pubsub_v1.types.PushConfig(push_endpoint=endpoint)

    try:
        subscription = subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "push_config": push_config,
            }
        )
        logger.info(f"Push subscription created: {subscription}")
    except google_exceptions.AlreadyExists:
        logger.info(f"Push subscription already exists: {subscription_path}")
    except Exception as e:
        logger.error(f"Error creating push subscription: {str(e)}")
        raise ValidationError(f"Failed to create push subscription: {str(e)}")


class GmailSubscriptionAdmin(InWorkspace):
    def save_model(self, request, obj, form, change):
        try:
            super().save_model(request, obj, form, change)

            setup_pubsub_topic(obj.workspace, obj.topic.project_id, obj.topic.topic_id)
            create_push_subscription(
                obj.workspace,
                obj.topic.project_id,
                obj.topic.topic_id,
                f"{obj.topic.topic_id}-sub",
                obj.push_endpoint,
            )

            self.message_user(
                request,
                "Successfully set up PubSub subscription",
                level=django_messages.SUCCESS,
            )
        except ValidationError as e:
            self.message_user(
                request,
                f"Error setting up PubSub subscription: {str(e)}",
                level=django_messages.ERROR,
            )
        except Exception as e:
            logger.exception("Unexpected error in GmailSubscriptionAdmin.save_model")
            self.message_user(
                request,
                f"An unexpected error occurred: {str(e)}",
                level=django_messages.ERROR,
            )
