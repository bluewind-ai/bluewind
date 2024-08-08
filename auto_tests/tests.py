import uuid
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from auto_tests.models import ModelAdminTestCase
from workspaces.models import Workspace
from django.contrib.admin.sites import AdminSite

class MyModelAdminTestCase(ModelAdminTestCase):
    model = Workspace

    def setUp(self):
        super().setUp()
        unique_username = f"admin_{uuid.uuid4().hex[:8]}"
        self.user = get_user_model().objects.create_superuser(unique_username, f'{unique_username}@test.com', 'password')
        self.client = Client()
        self.client.login(username=unique_username, password='password')
        self.workspace = Workspace.objects.create(name="Test Workspace")
        self.admin_site = AdminSite()
        session = self.client.session
        session['workspaces']= [
            {'workspace_id': self.admin_site.uuid_to_base10(self.workspace.id)}
        ]
        session.save()
        
    def get_workspace_id(self):
        return self.admin_site.uuid_to_base10(self.workspace.id)

    def test_admin_view(self):
        url = f'/admin/{self.get_workspace_id()}/workspaces/workspace/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def tearDown(self):
        get_user_model().objects.all().delete()
        Workspace.objects.all().delete()
        super().tearDown()