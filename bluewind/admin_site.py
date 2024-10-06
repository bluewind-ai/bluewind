import json
import logging

from django import template
from django.contrib.admin.helpers import ActionForm, AdminForm
from django.contrib.admin.views.main import ChangeList
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Model, QuerySet
from django.http.response import HttpResponseRedirectBase
from django.shortcuts import redirect
from django.utils.html import escapejs
from django.utils.safestring import mark_safe

from functions.go_next.v2.functions import go_next_v2
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
        superuser = User.objects.filter(username="wayne@bluewind.ai").first()
        if superuser:
            request.user = superuser
        return True

    # def each_context(self, request):
    #     context = super().each_context(request)
    #     workspace = get_workspace()

    #     if not workspace:
    #         raise Exception("Workspace not found")

    #         redirect_url = f"/workspaces/{workspace.id}{request.path}"
    #         context["redirect_url"] = redirect_url

    #     return context

    def admin_view(self, view, cacheable=False):
        def inner(request, *args, **kwargs):
            context = self.each_context(request)
            if request.path_info == "/":
                function_call_id, redirect_link, _ = go_next_v2(
                    function_call=None, user=None
                )
                return redirect(redirect_link)

            response = view(request, *args, **kwargs)
            return response

        return super().admin_view(inner, cacheable)


custom_admin_site = CustomAdminSite(name="customadmin")
