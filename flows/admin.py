from django.utils.html import format_html

from base_model_admin.admin import InWorkspace


class FlowAdmin(InWorkspace):
    list_display = (
        "name",
        "workspace",
        "type",
        "created_at",
        "updated_at",
        "custom_action_button",
    )

    def custom_action_button(self, obj):
        return format_html(
            '<a class="button" href="{}">Custom Action</a>', obj.get_custom_action_url()
        )

    custom_action_button.short_description = ""
    custom_action_button.allow_tags = True
