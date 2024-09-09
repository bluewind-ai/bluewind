import uuid

from channels.models import Channel
from credentials.models import Credentials as CredentialsModel
from django.test import TestCase
from django.utils import timezone
from users.models import User
from workspaces.models import Workspace

from .models import Flow, FlowRun, FlowStep, Model, StepRun


class SimpleFlowTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # This method is called once for the whole test case
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

        cls.flow_step = FlowStep.objects.create(
            flow=cls.flow,
            action_type=FlowStep.ActionType.CREATE,
            model=cls.channel_model,
            workspace=cls.workspace,
        )

        cls.default_credentials = CredentialsModel.objects.create(
            workspace=cls.workspace,
            key="DEFAULT_GMAIL_CREDENTIALS",
            value='{"dummy": "credentials"}',
        )

    def setUp(self):
        # This method is called before each test
        pass

    def test_create_channel_flow(self):
        unique_email = f"newchannel_{uuid.uuid4().hex[:8]}@example.com"

        flow_run = FlowRun.objects.create(
            flow=self.flow,
            workspace=self.workspace,
            state={
                "channel_email": unique_email,
            },
        )

        step_run = StepRun.objects.create(
            flow_run=flow_run, flow_step=self.flow_step, workspace=self.workspace
        )

        step_run.process_step_run()

        step_run.refresh_from_db()
        flow_run.refresh_from_db()

        created_channel_email = flow_run.state.get("created_channel_email")
        created_channel = Channel.objects.filter(email=created_channel_email).first()

        self.assertIsNotNone(created_channel, "Channel was not created")
        if created_channel:
            self.assertEqual(created_channel.email, created_channel_email)
            self.assertEqual(created_channel.workspace, self.workspace)
            self.assertEqual(
                created_channel.gmail_credentials, self.default_credentials
            )

        self.assertIn("created_channel_id", flow_run.state)
        if created_channel:
            self.assertEqual(flow_run.state["created_channel_id"], created_channel.id)

        self.assertEqual(step_run.status, "COMPLETED")
