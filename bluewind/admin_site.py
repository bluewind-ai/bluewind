import json
import logging

from django import template
from django.contrib.admin import AdminSite
from django.contrib.admin.helpers import ActionForm, AdminForm
from django.contrib.admin.views.main import ChangeList
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Model, QuerySet
from django.http.response import HttpResponseRedirectBase
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.utils.html import escapejs
from django.utils.safestring import mark_safe

from bluewind.context_variables import get_workspace_id
from flows.models import Flow, FlowRun
from workspaces.models import Workspace, WorkspaceUser

logger = logging.getLogger(__name__)


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


class CustomAdminSite(AdminSite):
    def logout(self, request, extra_context=None):
        super().logout(request, extra_context)
        return redirect("/workspaces/2/accounts/logout/")

    def each_context(self, request):
        context = super().each_context(request)
        workspace_id = get_workspace_id()

        if not workspace_id:
            workspace = Workspace.objects.filter(
                workspaceuser__user=request.user, workspaceuser__is_default=True
            ).first()

            if not workspace:
                workspace = Workspace.objects.create(name="Default Workspace")
                WorkspaceUser.objects.create(
                    user=request.user, workspace=workspace, is_default=True
                )

            redirect_url = f"/workspaces/{workspace.id}{request.path}"
            context["redirect_url"] = redirect_url

        try:
            flow = Flow.objects.get(
                name="command_palette_get_commands", workspace_id=workspace_id
            )
            flow_run = FlowRun.objects.create(
                flow=flow,
                workspace_id=workspace_id,
                user=request.user,
            )
            context["flows_data"] = flow_run.state["flow_result"]
        except Flow.DoesNotExist:
            logger.warning(
                f"Flow 'command_palette_get_commands' not found for workspace {workspace_id}"
            )
            context["flows_data"] = None  # or some default value

        return context

    def admin_view(self, view, cacheable=False):
        def inner(request, *args, **kwargs):
            context = self.each_context(request)
            if "redirect_url" in context:
                return redirect(context["redirect_url"])

            response = view(request, *args, **kwargs)

            if isinstance(response, TemplateResponse):
                # Convert the context data to JSON
                json_data = json.dumps(
                    response.context_data, cls=MyJsonEncoder, ensure_ascii=False
                )

                # Add the JSON data to the context
                response.context_data["json_data"] = json_data

            return response

        return super().admin_view(inner, cacheable)

    def is_ajax(self, request):
        return request.headers.get("x-requested-with") == "XMLHttpRequest"


custom_admin_site = CustomAdminSite(name="customadmin")
