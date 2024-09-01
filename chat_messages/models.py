import base64
import logging

from base_model.models import BaseModel
from base_model_admin.models import BaseAdmin
from channels.models import get_gmail_service
from django.contrib import messages
from django.db import models, transaction
from django.shortcuts import redirect
from django.urls import reverse
from people.models import Person
from workspaces.models import Workspace

logger = logging.getLogger(__name__)


class Message(BaseModel):
    from channels.models import Channel

    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="received_messages"
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    subject = models.CharField(max_length=255, blank=True, null=True)
    gmail_message_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        unique_together = ["workspace", "gmail_message_id"]

    def __str__(self):
        return f"From {self.channel.email} to {self.recipient}: {self.content[:50]}"


# Admin registration remains the same


class MessageAdmin(BaseAdmin):
    def add_view(self, request, form_url="", extra_context=None):
        if request.method == "POST":
            try:
                with transaction.atomic():
                    # Create and save the message
                    channel_id = request.POST.get("channel")
                    recipient_id = request.POST.get("recipient")
                    subject = request.POST.get("subject")
                    content = request.POST.get("content")

                    message = Message(
                        channel_id=channel_id,
                        recipient_id=recipient_id,
                        subject=subject,
                        content=content,
                        workspace=Workspace.objects.get(
                            public_id=request.environ["WORKSPACE_PUBLIC_ID"]
                        ),
                    )
                    logger.info(f"Message created: {message}")

                    # Send email using Gmail API
                    try:
                        service = get_gmail_service()
                        logger.info("Gmail service obtained")
                        message_body = {
                            "raw": base64.urlsafe_b64encode(
                                f"To: {message.recipient.email}\r\nSubject: {subject}\r\n\r\n{content}".encode()
                            ).decode()
                        }
                        sent_message = (
                            service.users()
                            .messages()
                            .send(userId="me", body=message_body)
                            .execute()
                        )
                        logger.info(f"Email sent: {sent_message}")
                        message.gmail_message_id = sent_message["id"]
                        message.save()
                        logger.info("Message updated with gmail_message_id")
                    except Exception as email_error:
                        logger.error(f"Error sending email: {str(email_error)}")
                        raise  # Re-raise the exception to trigger the outer exception handler

                self.message_user(
                    request,
                    "Message created and email sent successfully via Gmail.",
                    level=messages.SUCCESS,
                )
            except Exception as e:
                logger.exception("Failed to create message and send email")
                self.message_user(
                    request,
                    f"Failed to create message and send email: {str(e)}",
                    level=messages.ERROR,
                )

            return redirect(reverse("admin:chat_messages_message_changelist"))

        return super().add_view(request, form_url, extra_context)
