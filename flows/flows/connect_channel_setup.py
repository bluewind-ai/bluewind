from django.contrib.auth import get_user_model
from django.utils import timezone

from channels.models import Channel
from credentials.models import Credentials


def connect_channel_setup(workspace):
    # Create user
    user = get_user_model().objects.create_user(
        username=f"testuser_{timezone.now().timestamp()}", password="testpassword"
    )

    # Create Gmail credential
    gmail_credential = Credentials.objects.create(
        workspace=workspace,
        key="GMAIL_CLIENT_SECRET_BASE64",
        value="base64_encoded_client_secret_here",
    )

    # Create channel
    channel = Channel.objects.create(
        workspace=workspace,
        email="test@example.com",
        user=user,
        gmail_credentials=gmail_credential,
    )

    return None
