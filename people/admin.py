import random
from time import sleep

from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import reverse

from base_model_admin.admin import InWorkspace
from channels.models import Channel
from chat_messages.models import Message
from draft_messages.models import DraftMessage
from people.models import Person


class PersonAdmin(InWorkspace):
    list_filter = ("status", "source")
    search_fields = ("first_name", "last_name", "email", "company_domain_name")
    actions = ["enrich_emails"]
    list_select_related = ("assigned_to", "workspace")
    change_actions = ("do_stuff_action", "find_leads_action")

    class MessageInline(admin.TabularInline):
        model = Message
        extra = 0
        fields = ["content"]
        readonly_fields = ["timestamp", "is_read"]
        fk_name = "recipient"

        def get_queryset(self, request):
            return super().get_queryset(request)

    inlines = [MessageInline]

    def enrich_emails(self, request, queryset):
        enriched_count = 0
        for person in queryset:
            if person.enrich_email():
                enriched_count += 1
        if enriched_count:
            self.message_user(
                request,
                f"{enriched_count} person(s) enriched successfully.",
                messages.SUCCESS,
            )
        else:
            self.message_user(
                request,
                "No people were enriched. Check the logs for details.",
                messages.WARNING,
            )

    enrich_emails.short_description = "Enrich emails using PersonMagic"

    def do_stuff_action(self, request, obj):
        sleep(5)
        message = obj.do_stuff()
        self.message_user(request, message, level=messages.SUCCESS)
        return HttpResponseRedirect(
            reverse("admin:people_person_change", args=[obj.id])
        )

    from django.forms.models import model_to_dict

    # def save_model(self, request, obj, form, change):
    #     # Capture the input data
    #     input_data = form.cleaned_data.copy()

    #     # Convert non-serializable objects in input_data
    #     for key, value in input_data.items():
    #         if not isinstance(value, (str, int, float, bool, type(None))):
    #             input_data[key] = str(value)

    #     # Determine if this is a create or update action
    #     action = "update" if change else "create"

    #     # Call the original save_model method
    #     super().save_model(request, obj, form, change)

    #     # Capture the output data
    #     output_data = model_to_dict(obj)

    #     # Convert non-serializable objects in output_data
    #     for key, value in output_data.items():
    #         if not isinstance(value, (str, int, float, bool, type(None))):
    #             output_data[key] = str(value)

    #     # Combine input and output data
    #     event_data = {"input": input_data, "output": output_data}

    #     # Record the event
    #     AdminEvent.objects.create(
    #         user=request.user,
    #         action=action,
    #         model_name="Person",
    #         object_id=obj.id,
    #         data=event_data,
    #         workspace_id=obj.workspace_id,
    #     )

    def find_leads_action(self, request, obj):
        sleep(7)  # Simulating some processing time

        # Create a draft message
        channel = Channel.objects.filter(workspace=obj.workspace).first()
        if not channel:
            self.message_user(
                request, "No channel found for this workspace.", level=messages.ERROR
            )
            return HttpResponseRedirect(
                reverse("admin:people_person_change", args=[obj.id])
            )

        # Try to get a sender, with fallback options
        sender = Person.objects.filter(id=1).first()
        if not sender:
            # Fallback 1: Try to get any Person object
            sender = Person.objects.first()

        if not sender:
            # Fallback 2: If still no sender, use the current person as both sender and recipient
            sender = obj

        if not sender:
            # If we still don't have a sender, we can't create the draft message
            self.message_user(
                request,
                "No valid sender found for the draft message.",
                level=messages.ERROR,
            )
            return HttpResponseRedirect(
                reverse("admin:people_person_change", args=[obj.id])
            )

        f"Dear {
            obj.first_name},\n\nI hope this email finds you well. I came across your profile and thought you might be interested in our services...\n\nBest regards,\nYour Name"

        try:
            DraftMessage.objects.create(
                workspace=obj.workspace,
                channel=channel,
                recipient=obj,
                sender=sender,
                content="""Do you want to talk to people like Sara for example:

http://www.linkedin.com/in/saravandenbroek

Let me know and I will build you a list.""",
                subject="ESG pivot",
                gmail_draft_id=f"draft_{random.randint(1000, 9999)}",  # Generate a random draft ID for this example
            )
            message = f"Created a draft message for {obj.first_name} {obj.last_name}"
            self.message_user(request, message, level=messages.SUCCESS)
        except Exception as e:
            self.message_user(
                request,
                f"Failed to create draft message: {str(e)}",
                level=messages.ERROR,
            )

        return HttpResponseRedirect(
            reverse("admin:people_person_change", args=[obj.id])
        )
