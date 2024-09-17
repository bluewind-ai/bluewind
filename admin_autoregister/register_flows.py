def load_flows(workspace):
    import importlib.util
    import os

    from django.contrib.auth import get_user_model

    from flows.models import Flow

    User = get_user_model()
    default_user = User.objects.get(id=1)

    flows_dir = os.path.join(os.environ["BASE_DIR"], "flows")

    for flow_folder in os.listdir(flows_dir):
        flow_folder_path = os.path.join(flows_dir, flow_folder)
        if os.path.isdir(flow_folder_path):
            flows_file_path = os.path.join(flow_folder_path, "flows.py")
            if os.path.exists(flows_file_path):
                flow_name = flow_folder

                # Import the module
                spec = importlib.util.spec_from_file_location(
                    flow_name, flows_file_path
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)

                # Check if the module has a function with the same name as the folder
                if hasattr(module, flow_name):
                    # Create the Flow in the database as a 'python' type flow
                    Flow.objects.create(
                        workspace=workspace,
                        name=flow_name,
                        user=default_user,
                    )
