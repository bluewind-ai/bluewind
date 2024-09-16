from django_object_actions import DjangoObjectActions

from base_model_admin.admin import InWorkspace
from flows.flows.flow_runs_create_form import flow_runs_create_form


class FlowAdmin(DjangoObjectActions, InWorkspace):
    add_form_template = "admin/flow_runs/flowrun/add_form.html"
    change_form_template = "admin/flows/flow/change_form.html"

    change_actions = ("run_flow",)

    def run_flow(self, request, obj):
        # Implement your custom action logic here
        # For example:
        # Do something with the flow object
        context = self.admin_site.each_context(request)
        return flow_runs_create_form(
            request, obj, "admin/flow_runs/flowrun/add_form.html", context
        )

    run_flow.label = "Run Flow"
    run_flow.short_description = "Perform a custom action on this Flow"
