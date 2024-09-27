# # Create your models here.
# from django.db import models

# from workspaces.models import WorkspaceRelated


# class DomainName(WorkspaceRelated):
#     name = models.CharField(max_length=253, unique=True)

#     def __str__(self):
#         return self.name

#     class Meta:
#         unique_together = ("workspace", "name")
