from channels.models import Channel
from credentials.models import Credentials
from django.core.exceptions import ValidationError
from django.test import TestCase
from flows.models import Action, ActionRun, Flow, FlowRun, Model, Step, StepRun
from users.models import User
from workspaces.models import Workspace


class SimpleFlowTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.workspace = Workspace.objects.create(name="Test Workspace")
        cls.user = User.objects.create_user(
            username="testuser", email="test@example.com"
        )

    def setUp(self):
        self.flow = Flow.objects.create(name="Test Flow", workspace=self.workspace)

        # Create Model and Action for Step
        self.model, _ = Model.objects.get_or_create(
            name="Channel", app_label="channels", workspace=self.workspace
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
            workspace=self.workspace,
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
        # Create a test user and credentials
        test_user = User.objects.create_user(
            username="testuser2", email="testuser2@example.com"
        )
        test_credentials = Credentials.objects.create(
            workspace=self.workspace,
            key="TEST_GMAIL_CREDENTIALS",
            value="test_credentials2",
        )

        action_run = self.create_action_run(
            {
                "email": "valid@example.com",
                "user_id": test_user.id,
                "gmail_credentials_id": test_credentials.id,
            }
        )

        self.assertEqual(action_run.status, "COMPLETED")
        self.assertEqual(Channel.objects.count(), 1)
        channel = Channel.objects.first()
        self.assertEqual(channel.email, "valid@example.com")
        self.assertEqual(channel.user, test_user)
        self.assertEqual(channel.gmail_credentials, test_credentials)

    def test_create_channel_flow_with_invalid_input(self):
        with self.assertRaises(ValidationError):
            self.create_action_run(
                {
                    "email": "invalid_email",
                    "user_id": self.user.id,
                    "gmail_credentials_id": Credentials.objects.first().id,
                }
            )
        self.assertEqual(Channel.objects.count(), 0)

    def test_action_run_results(self):
        test_user = User.objects.create_user(
            username="testuser3", email="testuser3@example.com"
        )
        test_credentials = Credentials.objects.create(
            workspace=self.workspace,
            key="TEST_GMAIL_CREDENTIALS2",
            value="test_credentials3",
        )

        action_run = self.create_action_run(
            {
                "email": "test_results@example.com",
                "user_id": test_user.id,
                "gmail_credentials_id": test_credentials.id,
            }
        )
        self.assertIn("action", action_run.results)
        self.assertIn("model", action_run.results)
        self.assertIn("id", action_run.results)

    def test_flow_run_state_update(self):
        test_user = User.objects.create_user(
            username="testuser4", email="testuser4@example.com"
        )
        test_credentials = Credentials.objects.create(
            workspace=self.workspace,
            key="TEST_GMAIL_CREDENTIALS3",
            value="test_credentials4",
        )

        action_run = self.create_action_run(
            {
                "email": "state_test@example.com",
                "user_id": test_user.id,
                "gmail_credentials_id": test_credentials.id,
            }
        )
        self.flow_run.refresh_from_db()
        self.assertIn("created_channel_id", self.flow_run.state)
        self.assertIn("created_channel_email", self.flow_run.state)
        self.assertEqual(
            self.flow_run.state["created_channel_email"], "state_test@example.com"
        )
