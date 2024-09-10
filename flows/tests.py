import json
import uuid

from channels.models import Channel
from credentials.models import Credentials as CredentialsModel
from django.test import TestCase
from django.utils import timezone
from flows.models import Action, ActionRun, Flow, FlowRun, Model, Step
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
            flow=cls.flow,
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
        unique_email = f"newchannel_{uuid.uuid4().hex[:8]}@example.com"

        flow_run = FlowRun.objects.create(
            flow=self.flow,
            workspace=self.workspace,
            state={
                "channel_email": unique_email,
            },
        )

        action_input = {"email": unique_email}
        action_run = ActionRun.objects.create(
            flow_run=flow_run,
            action=self.action,
            step=self.flow_step,
            workspace=self.workspace,
            user=self.user,
            model_name="Channel",
            action_input=action_input,
            data=json.dumps({"input": action_input}),  # Add this line
        )

        action_run.process_action_run()

        action_run.refresh_from_db()
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

        self.assertEqual(action_run.status, "COMPLETED")
