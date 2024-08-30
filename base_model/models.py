# models.py
from django.db import models
from bluewind.utils import uuid7
from model_clone import CloneMixin

from public_id.models import public_id


class BaseModel(CloneMixin, models.Model):
    from workspaces.models import Workspace

    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    # workspace_public_id = models.CharField(max_length=50)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)


    @property
    def public_id(self):
        public_id(self.__class__.__name__, self.id)
    
    class Meta:
        abstract = True

    _clone_excluded_fields = ['id']  # Exclude id from cloning as it's the primary key

    def make_clone(self, attrs=None, **kwargs):
        defaults = {'id': uuid7()}  # Generate a new id for the clone
        if 'new_workspace_public_id' in kwargs:
            defaults['workspace_public_id'] = kwargs.pop('new_workspace_public_id')
        defaults.update(attrs or {})
        return super().make_clone(attrs=defaults, **kwargs)

    @classmethod
    def clone_workspace_related(cls, old_workspace_public_id, new_workspace_public_id):
        objects = cls.objects.filter(workspace_public_id=old_workspace_public_id)
        for obj in objects:
            # if name of model is DBGraph, ignore
            print("cndsjkcndsjkncjkdsnjkcds", obj.__class__.__name__)
            obj.make_clone(new_workspace_public_id=new_workspace_public_id)