import uuid

from auto_tests.models import ModelAdminTestCase
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.test import Client
from workspaces.models import Workspace


class MyModelAdminTestCase(ModelAdminTestCase):
    model = Workspace

    def setUp(self):
        super().setUp()
        unique_username = f"admin_{uuid.uuid().hex[:8]}"
        self.user = get_user_model().objects.create_superuser(
            unique_username, f"{unique_username}@test.com", "password"
        )
        self.client = Client()
        self.client.login(username=unique_username, password="password")
        self.workspace = Workspace.objects.create(name="Test Workspace")
        self.admin_site = AdminSite()

    def tearDown(self):
        get_user_model().objects.all().delete()
        Workspace.objects.all().delete()
        super().tearDown()
