from time import sleep

from django_object_actions import DjangoObjectActions, action

from base_model_admin.admin import InWorkspace
from chat_messages.models import Message
from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import reverse


class PersonAdmin(DjangoObjectActions, InWorkspace):
    list_filter = ("status", "source")
    search_fields = ("first_name", "last_name", "email", "company_domain_name")
    actions = ["enrich_emails"]
    list_select_related = ("assigned_to", "workspace")
    change_actions = ("do_stuff_action", "find_leads_action")  # Added new action here

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

    @action(
        label="Enrich",
        description="Populate this person with random data",
    )
    def do_stuff_action(self, request, obj):
        sleep(5)
        message = obj.do_stuff()
        self.message_user(request, message, level=messages.SUCCESS)
        return HttpResponseRedirect(
            reverse("admin:people_person_change", args=[obj.id])
        )

    @action(
        label="Find Leads",
        description="Find potential leads related to this person",
    )
    def find_leads_action(self, request, obj):
        sleep(3)  # Simulating some processing time
        # Here you would typically call a method on the Person model to find leads
        # For this example, we'll just use a dummy message
        message = f"Found 5 potential leads related to {obj.first_name} {obj.last_name}"
        self.message_user(request, message, level=messages.SUCCESS)
        return HttpResponseRedirect(
            reverse("admin:people_person_change", args=[obj.id])
        )
