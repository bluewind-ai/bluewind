# from django.db import models

# from users.models import User
# from workspaces.models import WorkspaceRelated


# class Approval(WorkspaceRelated):
#     class Status(models.TextChoices):
#         PENDING = "pending", "Pending"
#         APPROVED = "approved", "Approved"
#         REJECTED = "rejected", "Rejected"

#     flow_run = models.ForeignKey(
#         "FlowRun", on_delete=models.CASCADE, related_name="approvals"
#     )
#     status = models.CharField(
#         max_length=20,
#         choices=Status.choices,
#         default=Status.PENDING,
#     )
#     approver = models.ForeignKey(
#         User, on_delete=models.SET_NULL, null=True, related_name="approvals"
#     )
#     approved_at = models.DateTimeField(null=True, blank=True)
#     comment = models.TextField(blank=True)

#     def __str__(self):
#         return f"Approval for FlowRun {self.flow_run.id} - {self.get_status_display()}"

#     class Meta:
#         ordering = ["-approved_at"]
