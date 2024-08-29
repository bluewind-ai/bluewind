import base64
from django.db import models
from django.shortcuts import redirect
from django.urls import reverse
from base_model.models import BaseModel
from people.models import Person
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib import messages
from django.db import transaction
from workspaces.models import custom_admin_site
from inboxes.models import get_gmail_service
import base64
import logging

logger = logging.getLogger(__name__)


class Message(BaseModel):
    from inboxes.models import Inbox
    sender = models.ForeignKey(Inbox, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    subject = models.CharField(max_length=255, blank=True, null=True)
    gmail_message_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    def __str__(self):
        return f"From {self.sender.email} to {self.recipient}: {self.content[:50]}"


# Admin registration remains the same
from django.contrib import admin
from workspaces.models import custom_admin_site

class MessageAdmin(admin.ModelAdmin):
    def add_view(self, request, form_url='', extra_context=None):
        if request.method == 'POST':
            try:
                with transaction.atomic():
                    # Create and save the message
                    sender_id = request.POST.get('sender')
                    recipient_id = request.POST.get('recipient')
                    subject = request.POST.get('subject')
                    content = request.POST.get('content')

                    message = Message(
                        sender_id=sender_id,
                        recipient_id=recipient_id,
                        subject=subject,
                        content=content
                    )
                    message.save()
                    logger.info(f"Message created: {message}")

                    # Send email using Gmail API
                    try:
                        service = get_gmail_service()
                        logger.info("Gmail service obtained")
                        message_body = {
                            'raw': base64.urlsafe_b64encode(
                                f"To: {message.recipient.email}\r\nSubject: {subject}\r\n\r\n{content}".encode()
                            ).decode()
                        }
                        sent_message = service.users().messages().send(userId='me', body=message_body).execute()
                        logger.info(f"Email sent: {sent_message}")
                        message.gmail_message_id = sent_message['id']
                        message.save()
                        logger.info("Message updated with gmail_message_id")
                    except Exception as email_error:
                        logger.error(f"Error sending email: {str(email_error)}")
                        raise  # Re-raise the exception to trigger the outer exception handler

                self.message_user(request, "Message created and email sent successfully via Gmail.", level=messages.SUCCESS)
            except Exception as e:
                logger.exception("Failed to create message and send email")
                self.message_user(request, f"Failed to create message and send email: {str(e)}", level=messages.ERROR)
            
            return redirect(reverse('admin:chat_messages_message_changelist'))
        
        return super().add_view(request, form_url, extra_context)

custom_admin_site.register(Message, MessageAdmin)