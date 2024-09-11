from credentials.models import Credentials
from django.contrib.auth import get_user_model
from django.utils import timezone
from flows.models import Action, Flow, FlowRun, Step
from workspaces.models import Workspace


def create_basic_flow(flow_run):
    # Create workspace
    workspace = Workspace.objects.create(
        name=f"Test Workspace {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    # Create user
    user = get_user_model().objects.create_user(
        username=f"testuser_{timezone.now().timestamp()}", password="testpassword"
    )

    # Create the setup flow
    setup_flow = Flow.objects.create(
        workspace_id=workspace.id,
        name="Setup Test Environment",
    )

    # Create and start the flow run
    flow_run = FlowRun.objects.create(
        flow=setup_flow,
        workspace_id=workspace.id,
        status=FlowRun.Status.IN_PROGRESS,
        user_id=user.id,
        state={},
    )

    # Create credential
    credential = Credentials.objects.create(
        workspace_id=workspace.id, key="TEST_CREDENTIAL", value="test_value"
    )

    # Get or create the action
    action, _ = Action.objects.get_or_create(
        workspace_id=workspace.id,
        action_type=Action.ActionType.CREATE,
        model__name="credentials",
    )

    # Create test flow
    test_flow = Flow.objects.create(workspace_id=workspace.id, name="Test Flow")

    # Create step
    step = Step.objects.create(workspace_id=workspace.id, flow=test_flow, action=action)

    # Update flow run state and status
    FlowRun.objects.filter(id=flow_run.id).update(
        state={
            "created_credential_id": credential.id,
            "created_flow_id": test_flow.id,
            "created_step_id": step.id,
        },
        status=FlowRun.Status.COMPLETED,
    )

    return {
        "flow_run_id": flow_run.id,
        "workspace_id": workspace.id,
        "user_id": user.id,
        "credential_id": credential.id,
        "test_flow_id": test_flow.id,
        "step_id": step.id,
    }
