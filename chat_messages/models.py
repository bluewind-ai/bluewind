import base64
import logging

from base_model_admin.admin import InWorkspace
from django.contrib import messages
from django.db import models, transaction
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.html import format_html
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger(__name__)


class Message(WorkspaceRelated):
    from channels.models import Channel
    from people.models import Person

    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="received_messages"
    )
    sender = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="messages"
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    subject = models.CharField(max_length=255, blank=True, null=True)
    gmail_message_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        unique_together = ["workspace", "gmail_message_id"]

    def __str__(self):
        return f"{self.subject}: {self.content[:50]}"


# Admin registration remains the same


class MessageAdmin(InWorkspace):
    list_display = ["sender", "recipient_link", "subject"]
    list_filter = ["sender"]
    search_fields = ["subject", "content"]

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("workspace", "sender", "recipient", "channel")
        )

    def recipient_link(self, obj):
        return format_html(
            '<a href="{}">{}</a>',
            reverse("admin:people_person_change", args=[obj.recipient_id]),
            obj.recipient,
        )

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
                            id=request.environ["WORKSPACE_ID"]
                        ),
                    )
                    logger.info(f"Message created: {message}")

                    # Send email using Gmail API
                    try:
                        from channels.models import get_gmail_service

                        service = service = get_gmail_service(channel=message.channel)
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
