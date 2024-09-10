import uuid

from channels.models import Channel
from credentials.models import Credentials
from django.core.exceptions import ValidationError
from django.test import TransactionTestCase
from flows.models import Action, ActionRun, Flow, FlowRun, Model, Step, StepRun
from users.models import User
from workspaces.models import Workspace


class SimpleFlowTestCase(TransactionTestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(name="Test Workspace")
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com"
        )
        self.flow = Flow.objects.create(name="Test Flow", workspace=self.workspace)

        # Create Model and Action for Step
        unique_name = f"Channel_{uuid.uuid4().hex[:8]}"
        self.model, _ = Model.objects.get_or_create(
            name=unique_name, app_label="channels", workspace=self.workspace
        )
        self.action = Action.objects.create(
            workspace=self.workspace,
            action_type=Action.ActionType.CREATE,
            model=self.model,
        )

        # Now create Step with all required fields
        self.step = Step.objects.create(
            flow=self.flow, workspace=self.workspace, action=self.action
        )

        self.flow_run = FlowRun.objects.create(flow=self.flow, workspace=self.workspace)
        self.step_run = StepRun.objects.create(
            step=self.step,
            flow_run=self.flow_run,
            workspace=self.workspace,  # Add this line
        )

        Credentials.objects.create(
            workspace=self.workspace,
            key="DEFAULT_GMAIL_CREDENTIALS",
            value="test_credentials",
        )

    def create_action_run(self, action_input):
        return ActionRun.objects.create(
            step_run=self.step_run,
            workspace=self.workspace,
            user=self.user,
            model_name="channels.Channel",
            action_input=action_input,
            action=self.action,
        )

    def test_create_channel_flow_with_valid_input(self):
        action_run = self.create_action_run({"email": "valid@example.com"})
        self.assertEqual(action_run.status, "COMPLETED")
        self.assertEqual(Channel.objects.count(), 1)
        channel = Channel.objects.first()
        self.assertEqual(channel.email, "valid@example.com")

    def test_create_channel_flow_with_invalid_input(self):
        with self.assertRaises(ValidationError):
            self.create_action_run(
                {"name": "Invalid Channel", "description": "This should fail"}
            )
        self.assertEqual(Channel.objects.count(), 0)

    def test_action_run_results(self):
        action_run = self.create_action_run({"email": "test_results@example.com"})
        self.assertIn("action", action_run.results)
        self.assertIn("model", action_run.results)
        self.assertIn("id", action_run.results)

    def test_flow_run_state_update(self):
        action_run = self.create_action_run({"email": "state_test@example.com"})
        self.flow_run.refresh_from_db()
        self.assertIn("created_channel_id", self.flow_run.state)
        self.assertIn("created_channel_email", self.flow_run.state)
        self.assertEqual(
            self.flow_run.state["created_channel_email"], "state_test@example.com"
        )
