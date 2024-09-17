import importlib
import os

from django.conf import settings


def load_flows(workspace):
    from django.contrib.auth import get_user_model

    from flows.models import Flow

    User = get_user_model()
    default_user = User.objects.get(id=1)

    flows_dir = os.path.join(settings.BASE_DIR, "flows")

    for filename in os.listdir(flows_dir):
        if filename.endswith(".py"):
            flow_name = filename[:-3]  # Remove .py extension
            flow_path = os.path.join(flows_dir, filename)

            # Import the module
            spec = importlib.util.spec_from_file_location(flow_name, flow_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Check if the module has a function with the same name
            if hasattr(module, flow_name):
                # Create the Flow in the database as a 'python' type flow
                Flow.objects.create(
                    workspace=workspace,
                    name=flow_name,
                    type="python",
                    user=default_user,
                )
