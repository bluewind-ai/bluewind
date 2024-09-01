import json
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html

from user_sessions.templatetags.user_sessions import device, location

from .models import Session


class ExpiredFilter(admin.SimpleListFilter):
    title = _("Is Valid")
    parameter_name = "active"

    def lookups(self, request, model_admin):
        return (("1", _("Active")), ("0", _("Expired")))

    def queryset(self, request, queryset):
        if self.value() == "1":
            return queryset.filter(expire_date__gt=now())
        elif self.value() == "0":
            return queryset.filter(expire_date__lte=now())


class OwnerFilter(admin.SimpleListFilter):
    title = _("Owner")
    parameter_name = "owner"

    def lookups(self, request, model_admin):
        return (("my", _("Self")),)

    def queryset(self, request, queryset):
        if self.value() == "my":
            return queryset.filter(user=request.user)


class SessionAdmin(admin.ModelAdmin):
    list_display = (
        "ip",
        "user",
        "is_valid",
        "location",
        "device",
    )
    search_fields = ()
    list_filter = ExpiredFilter, OwnerFilter
    raw_id_fields = ("user",)
    exclude = ("session_key",)
    list_select_related = ["user"]
    readonly_fields = ("decoded_session_data",)

    def get_search_fields(self, request):
        User = get_user_model()
        return ("ip", f"user__{getattr(User, 'USERNAME_FIELD', 'username')}")

    def is_valid(self, obj):
        return obj.expire_date > now()

    is_valid.boolean = True

    def location(self, obj):
        return location(obj.ip)

    def device(self, obj):
        return device(obj.user_agent) if obj.user_agent else ""

    def decoded_session_data(self, obj):
        try:
            decoded_data = obj.get_decoded()
            # Convert to JSON for pretty formatting
            json_data = json.dumps(decoded_data, indent=2, cls=DjangoJSONEncoder)
            # Escape the JSON string and wrap it in a <pre> tag for formatting
            return format_html("<pre>{}</pre>", json_data)
        except Exception as e:
            return f"Error decoding: {str(e)}"

    decoded_session_data.short_description = "Session Data"


admin.site.register(Session, SessionAdmin)
