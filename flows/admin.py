from django.utils.html import format_html

from base_admin.admin import InWorkspace


class FlowAdmin(InWorkspace):
    list_display = (
        "name",
        "custom_action_button",
        "workspace",
        "created_at",
    )

    def custom_action_button(self, obj):
        return format_html(
            '<a class="button" href="{}">Custom Action</a>', obj.get_custom_action_url()
        )

    custom_action_button.short_description = ""
    custom_action_button.allow_tags = True
