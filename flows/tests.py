from credentials.models import Credentials as CredentialsModel
from django.test import TestCase
from django.utils import timezone
from flows.models import Action, ActionRun, Flow, FlowRun, Model, Step, StepRun
from users.models import User
from workspaces.models import Workspace


class SimpleFlowTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.workspace = Workspace.objects.create(name="Test Workspace")

        unique_username = f"testuser_{timezone.now().timestamp()}"
        cls.user = User.objects.create_user(
            username=unique_username, email="test@example.com"
        )

        cls.flow = Flow.objects.create(
            name="Create Channel Flow", workspace=cls.workspace
        )

        cls.channel_model, _ = Model.objects.get_or_create(
            name="Channel", app_label="channels", defaults={"workspace": cls.workspace}
        )

        cls.action = Action.objects.create(
            workspace=cls.workspace,
            action_type=Action.ActionType.CREATE,
            model=cls.channel_model,
        )

        cls.flow_step = Step.objects.create(
            flow=cls.flow,
            action=cls.action,
            workspace=cls.workspace,
        )

        cls.default_credentials = CredentialsModel.objects.create(
            workspace=cls.workspace,
            key="DEFAULT_GMAIL_CREDENTIALS",
            value='{"dummy": "credentials"}',
        )

    def test_create_channel_flow(self):
        workspace = Workspace.objects.create(name="Test Workspace")
        user = User.objects.create(username="testuser")
        flow = Flow.objects.create(name="Create Channel Flow", workspace=workspace)
        flow_run = FlowRun.objects.create(flow=flow, workspace=workspace)

        model = Model.objects.get(name="Channel", app_label="channels")
        action = Action.objects.create(
            workspace=workspace, action_type=Action.ActionType.CREATE, model=model
        )
        step = Step.objects.create(flow=flow, action=action, workspace=workspace)

        # First, create ActionRun
        action_run = ActionRun.objects.create(
            action=action,
            workspace=workspace,
            user=user,
            model_name="Channel",
            data={},
            action_input={"name": "Test Channel", "description": "A test channel"},
        )

        # Now create StepRun with the ActionRun
        step_run = StepRun.objects.create(
            step=step, workspace=workspace, action_run=action_run
        )

        # Update ActionRun with the created StepRun
        action_run.step_run = step_run
        action_run.save()

        self.assertEqual(action_run.action, action)
        self.assertEqual(action_run.step_run, step_run)
        self.assertEqual(step_run.action_run, action_run)
        self.assertEqual(action_run.workspace, workspace)
        self.assertEqual(action_run.user, user)
        self.assertEqual(action_run.model_name, "Channel")
        self.assertEqual(action_run.action_input["name"], "Test Channel")
        self.assertEqual(action_run.action_input["description"], "A test channel")
