from django_object_actions import action

from base_model_admin.admin import InWorkspace
from chat_messages.models import Message
from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import reverse


class PersonAdmin(InWorkspace):
    # list_display = ("first_name", "last_name", "email", "company_domain_name", "status")
    list_filter = ("status", "source")
    search_fields = ("first_name", "last_name", "email", "company_domain_name")
    actions = ["enrich_emails"]
    list_select_related = ("assigned_to", "workspace")

    from chat_messages.models import Message

    class MessageInline(admin.TabularInline):
        model = Message
        extra = 0
        fields = ["content"]
        readonly_fields = ["timestamp", "is_read"]
        fk_name = "recipient"  # Specify which ForeignKey to use

        def get_queryset(self, request):
            # We don't need to filter here, as Django will automatically filter
            # based on the inline's relationship
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
        label="Do Stuff",
        description="Perform some action on this person",
    )
    def do_stuff_action(self, request, obj):
        message = obj.do_stuff()
        self.message_user(request, message, level=messages.SUCCESS)
        return HttpResponseRedirect(
            reverse("admin:your_app_person_change", args=[obj.id])
        )

    change_actions = ("do_stuff_action",)
