from credentials.models import Credentials
from django.contrib.auth import get_user_model
from django.utils import timezone
from flows.models import Action, ActionRun, Flow, FlowRun, Model, Step, StepRun


def create_basic_flow(workspace):
    # Create user
    user = get_user_model().objects.create_user(
        username=f"testuser_{timezone.now().timestamp()}", password="testpassword"
    )

    # Create the setup flow
    setup_flow = Flow.objects.create(
        workspace=workspace,
        name="Setup Test Environment",
        type="no-code",
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

    # Get the action
    model = Model.objects.get(workspace=workspace, name="credentials")
    action = Action.objects.get(
        workspace=workspace,
        action_type=Action.ActionType.CREATE,
        model=model,
    )

    # Create step
    step = Step.objects.create(workspace=workspace, flow=setup_flow, action=action)

    # Create step run
    step_run = StepRun.objects.create(workspace=workspace, flow_run=new_flow_run)

    # Create action run
    action_run = ActionRun.objects.create(
        workspace=workspace,
        action=action,
        step_run=step_run,
        user=user,
        model_name=action.model.full_name,
        status="COMPLETED",
    )

    # Update flow run state and status
    new_flow_run.state = {
        "created_credential_id": credential.id,
        "created_step_id": step.id,
        "created_step_run_id": step_run.id,
        "created_action_run_id": action_run.id,
    }
    new_flow_run.status = FlowRun.Status.COMPLETED
    new_flow_run.save()

    return new_flow_run
