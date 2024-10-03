from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from workspaces.models import Workspace

User = get_user_model()


class Command(BaseCommand):
    help = "Creates a workspace for the superuser"

    def handle(self, *args, **options):
        superuser = User.objects.get(username="wayne@bluewind.ai")
        workspace = Workspace.objects.create(name="superuser", user=superuser)
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created workspace "{workspace.name}" for user {superuser.username}'
            )
        )
