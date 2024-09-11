from credentials.models import Credentials
from django.contrib.auth import get_user_model
from django.utils import timezone
from flows.models import Action, Flow, FlowRun, Step


def create_basic_flow(workspace):
    # Create user
    user = get_user_model().objects.create_user(
        username=f"testuser_{timezone.now().timestamp()}", password="testpassword"
    )

    # Create the setup flow
    setup_flow = Flow.objects.create(
        workspace=workspace,
        name="Setup Test Environment",
        type="no-code",  # Set this to 'no-code' to prevent recursion
    )

    # Create and start the flow run
    new_flow_run = FlowRun.objects.create(
        flow=setup_flow,
        workspace=workspace,
        status=FlowRun.Status.IN_PROGRESS,
        user=user,
        state={},
    )

    # Create credential
    credential = Credentials.objects.create(
        workspace=workspace, key="TEST_CREDENTIAL", value="test_value"
    )

    # Get or create the action
    action, _ = Action.objects.get_or_create(
        workspace=workspace,
        action_type=Action.ActionType.CREATE,
        model__name="credentials",
    )

    # Create test flow
    test_flow = Flow.objects.create(workspace=workspace, name="Test Flow")

    # Create step
    step = Step.objects.create(workspace=workspace, flow=test_flow, action=action)

    # Update flow run state and status
    new_flow_run.state = {
        "created_credential_id": credential.id,
        "created_flow_id": test_flow.id,
        "created_step_id": step.id,
    }
    new_flow_run.status = FlowRun.Status.COMPLETED
    new_flow_run.save()

    # The function doesn't return anything
