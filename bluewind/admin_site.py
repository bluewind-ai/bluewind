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
from gevent import getcurrent

from bluewind.context_variables import get_workspace_id
from functions.go_next.v1.functions import go_next_v1
from users.models import User
from workspaces.models import Workspace

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

    def each_context(self, request):
        context = super().each_context(request)
        workspace_id = get_workspace_id()

        if not workspace_id:
            workspace = Workspace.objects.filter(
                workspaceuser__user=request.user, workspaceuser__is_default=True
            ).first()

            # if not workspace:
            #     workspace = Workspace.objects.create(name="Default Workspace")
            #     WorkspaceUser.objects.create(
            #         user=request.user, workspace=workspace, is_default=True
            #     )

            redirect_url = f"/workspaces/{workspace.id}{request.path}"
            context["redirect_url"] = redirect_url

        # flow_run = FlowRun.objects.create(
        #     flow=Flow.objects.get(
        #         name="command_palette_get_commands", workspace_id=workspace_id
        #     ),
        #     user_id=1,
        #     workspace_id=get_workspace_id(),
        # )
        # run_flow(flow_run, request.user)

        return context

    def admin_view(self, view, cacheable=False):
        def inner(request, *args, **kwargs):
            if request.path == "/workspaces/1/admin/":
                return go_next_v1()

            # raise Exception("This is an exception")

            logger.debug(f"Starting request handling in greenlet {id(getcurrent())}")

            logger.debug(f"Finished sleep in greenlet {id(getcurrent())}")
            context = self.each_context(request)
            if "redirect_url" in context:
                return redirect(context["redirect_url"])

            response = view(request, *args, **kwargs)
            return response

        return super().admin_view(inner, cacheable)

    def is_ajax(self, request):
        return request.headers.get("x-requested-with") == "XMLHttpRequest"


custom_admin_site = CustomAdminSite(name="customadmin")
