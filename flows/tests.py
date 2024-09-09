from credentials.models import Credentials as CredentialsModel
from django.apps import apps
from django.test import TestCase
from django.utils import timezone
from users.models import User
from workspaces.models import Workspace

from .models import Flow, FlowRun, FlowStep, Model, StepRun


class SimpleFlowTestCase(TestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(name="Test Workspace")

        # Create a unique username
        unique_username = f"testuser_{timezone.now().timestamp()}"
        self.user = User.objects.create_user(
            username=unique_username, email="test@example.com"
        )

        self.flow = Flow.objects.create(
            name="Create Channel Flow", workspace=self.workspace
        )

        # Get or create the Channel model
        self.channel_model, _ = Model.objects.get_or_create(
            name="Channel", app_label="channels", defaults={"workspace": self.workspace}
        )

        self.flow_step = FlowStep.objects.create(
            flow=self.flow,
            action_type=FlowStep.ActionType.CREATE,
            model=self.channel_model,
            workspace=self.workspace,
        )

        self.default_credentials = CredentialsModel.objects.create(
            workspace=self.workspace,
            key="DEFAULT_GMAIL_CREDENTIALS",
            value='{"dummy": "credentials"}',
        )

    def test_create_channel_flow(self):
        channel_email = "newchannel@example.com"

        flow_run = FlowRun.objects.create(
            flow=self.flow,
            workspace=self.workspace,
            state={
                "channel_email": channel_email,
            },
        )

        step_run = StepRun.objects.create(
            flow_run=flow_run, flow_step=self.flow_step, workspace=self.workspace
        )

        Channel = apps.get_model("channels", "Channel")
        created_channel = Channel.objects.filter(email=channel_email).first()

        self.assertIsNotNone(created_channel)
        if created_channel:
            self.assertEqual(created_channel.email, channel_email)
            self.assertEqual(
                created_channel.user, User.objects.first()
            )  # Assuming the first user is used
            self.assertEqual(created_channel.workspace, self.workspace)
            self.assertEqual(
                created_channel.gmail_credentials, self.default_credentials
            )

        flow_run.refresh_from_db()
        self.assertIn("created_channel_id", flow_run.state)
        if created_channel:
            self.assertEqual(flow_run.state["created_channel_id"], created_channel.id)

        step_run.refresh_from_db()
        self.assertEqual(step_run.status, "COMPLETED")
