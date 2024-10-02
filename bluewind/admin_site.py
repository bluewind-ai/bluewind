import json
import logging

from django import template
from django.contrib.admin.helpers import ActionForm, AdminForm
from django.contrib.admin.views.main import ChangeList
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Model, QuerySet
from django.http.response import HttpResponseRedirectBase
from django.utils.html import escapejs
from django.utils.safestring import mark_safe

from users.models import User

logger = logging.getLogger("django.not_used")


register = template.Library()


@register.filter(is_safe=True)
def json_script(value):
    return mark_safe(json.dumps(value))


class MyJsonEncoder(DjangoJSONEncoder):
    def default(self, o):
        if isinstance(o, (HttpResponseRedirectBase, ActionForm, AdminForm, ChangeList)):
            return str(o)
        if isinstance(o, Model):
            return str(o)
        if isinstance(o, QuerySet):
            return list(o)
        if isinstance(o, bytes):
            return o.decode("utf-8")
        try:
            return super().default(o)
        except TypeError:
            return str(o)


def custom_json_dumps(data):
    json_string = json.dumps(data, cls=MyJsonEncoder, ensure_ascii=False)
    return escapejs(json_string)


from unfold.sites import UnfoldAdminSite


class CustomAdminSite(UnfoldAdminSite):
    def has_permission(self, request):
        request.user = User.objects.get(username="wayne@bluewind.ai")

        return True

    # def admin_view(self, view, cacheable=False):
    #     def inner(request, *args, **kwargs):
    #         if request.path == "/workspaces/1/admin/":
    #             master_v1()
    #             return redirect(
    #                 "/workspaces/1/admin/function_calls/functioncall/1/change"
    #             )

    #     return super().admin_view(inner, cacheable)


custom_admin_site = CustomAdminSite(name="customadmin")
