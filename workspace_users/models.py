from django.db import models


# Create your models here.
class WorkspaceUser(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    workspace = models.ForeignKey("workspaces.Workspace", on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "workspace")
