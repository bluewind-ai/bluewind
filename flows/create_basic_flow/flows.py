from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from action_runs.models import ActionRun
from actions.models import Action
from credentials.models import Credentials
from flow_runs.models import FlowRun
from flows.models import Flow
from step_runs.models import StepRun
from steps.models import Step


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
    content_type = ContentType.objects.get(app_label="credentials", model="credentials")
    action = Action.objects.get(
        workspace=workspace,
        action_type=Action.ActionType.CREATE,
        content_type=content_type,
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
        model_name=f"{content_type.app_label}.{content_type.model}",
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
