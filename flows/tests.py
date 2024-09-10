from channels.models import Channel
from credentials.models import Credentials
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from flows.models import Action, ActionRun, Flow, FlowRun, Model, Step, StepRun
from users.models import User
from workspaces.models import Workspace


class SimpleFlowTestCase(TestCase):
    def setUp(self):
        # Create Workspace
        self.workspace = Workspace.objects.create(name="Test Workspace")

        # Create User
        self.user = User.objects.create_user(
            username=f"testuser_{timezone.now().timestamp()}",
            email="test@example.com",
            password="testpassword",
        )

        # Create Flow
        self.flow = Flow.objects.create(
            name="Create Channel Flow", workspace=self.workspace
        )

        # Create Model
        self.channel_model, _ = Model.objects.get_or_create(
            name="Channel", app_label="channels", defaults={"workspace": self.workspace}
        )

        # Create Action
        self.action = Action.objects.create(
            workspace=self.workspace,
            action_type=Action.ActionType.CREATE,
            model=self.channel_model,
        )

        # Create Step
        self.flow_step = Step.objects.create(
            flow=self.flow,
            action=self.action,
            workspace=self.workspace,
        )

        # Create Default Credentials
        Credentials.objects.create(
            workspace=self.workspace,
            key="DEFAULT_GMAIL_CREDENTIALS",
            value='{"dummy": "credentials"}',
        )

        # Create FlowRun
        self.flow_run = FlowRun.objects.create(flow=self.flow, workspace=self.workspace)

        # Create StepRun
        self.step_run = StepRun.objects.create(
            step=self.flow_step, workspace=self.workspace, flow_run=self.flow_run
        )

    def test_create_channel_flow_with_invalid_input(self):
        # Try to create an ActionRun with invalid input
        with self.assertRaises(ValidationError):
            ActionRun.objects.create(
                action=self.action,
                step_run=self.step_run,
                workspace=self.workspace,
                user=self.user,
                model_name="Channel",
                data={},
                action_input={"name": "Test Channel", "description": "A test channel"},
            )

        # Verify that no Channel was created
        self.assertEqual(Channel.objects.count(), 0)

        # Verify that the ActionRun was created but has ERROR status
        action_run = ActionRun.objects.latest("id")
        self.assertEqual(action_run.status, "ERROR")
        self.assertIn("error", action_run.action_input)

    def test_create_channel_flow_with_valid_input(self):
        # Create ActionRun with valid input
        ActionRun.objects.create(
            action=self.action,
            step_run=self.step_run,
            workspace=self.workspace,
            user=self.user,
            model_name="Channel",
            data={},
            action_input={"email": "test@example.com"},
        )

        # Verify that a Channel was created
        self.assertEqual(Channel.objects.count(), 1)
        created_channel = Channel.objects.first()
        self.assertEqual(created_channel.email, "test@example.com")

        # Verify that the ActionRun was created and has COMPLETED status
        action_run = ActionRun.objects.latest("id")
        self.assertEqual(action_run.status, "COMPLETED")

    def test_create_channel_flow_without_required_fields(self):
        # Try to create an ActionRun without required fields
        with self.assertRaises(ValidationError):
            ActionRun.objects.create(
                action=self.action,
                step_run=self.step_run,
                workspace=self.workspace,
                user=self.user,
                model_name="Channel",
                data={},
                action_input={},  # Empty input, missing required fields
            )

        # Verify that no Channel was created
        self.assertEqual(Channel.objects.count(), 0)

        # Verify that the ActionRun was created but has ERROR status
        action_run = ActionRun.objects.latest("id")
        self.assertEqual(action_run.status, "ERROR")
        self.assertIn("error", action_run.action_input)
