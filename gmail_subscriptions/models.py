import logging

from google.api_core import exceptions as google_exceptions
from google.cloud import pubsub_v1
from google.oauth2 import service_account

from base_model_admin.models import BaseAdmin
from django.contrib import messages as django_messages
from django.db import models
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class GmailSubscription(WorkspaceRelated):
    project_id = models.CharField(max_length=100)
    topic_id = models.CharField(max_length=100)
    push_endpoint = models.URLField()

    label_ids = models.JSONField(default=list)
    label_filter_action = models.CharField(max_length=20, default="include")

    client_secret_file = models.CharField(max_length=255)
    oauth_scopes = models.JSONField(default=list)
    redirect_uri = models.URLField()

    @property
    def full_topic_name(self):
        return f"projects/{self.project_id}/topics/{self.topic_id}"


def get_pubsub_credentials():
    return service_account.Credentials.from_service_account_file(
        "google_backend_service_account.json",
        scopes=["https://www.googleapis.com/auth/pubsub"],
    )


def setup_pubsub_topic(project_id, topic_id):
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


def create_push_subscription(project_id, topic_id, subscription_id, endpoint):
    subscriber = pubsub_v1.SubscriberClient(credentials=get_pubsub_credentials())
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
        raise


class GmailSubscriptionAdmin(BaseAdmin):
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        setup_pubsub_topic(obj.project_id, obj.topic_id)
        create_push_subscription(
            obj.project_id,
            obj.topic_id,
            f"{obj.topic_id}-sub",  # Creating a default subscription ID
            obj.push_endpoint,
        )
        self.message_user(
            request,
            "Successfully set up Gmail push notifications",
            level=django_messages.SUCCESS,
        )
