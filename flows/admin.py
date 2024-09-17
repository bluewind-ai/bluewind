from base_model_admin.admin import InWorkspace
from django_object_actions import DjangoObjectActions


class FlowAdmin(DjangoObjectActions, InWorkspace):
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
