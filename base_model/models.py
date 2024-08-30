# models.py
from django.db import models
from bluewind.utils import uuid7
from model_clone import CloneMixin
from public_id.models import public_id

class BaseModel(CloneMixin, models.Model):
    from workspaces.models import Workspace

    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    public_id = models.CharField(max_length=100, unique=True, editable=False)

    class Meta:
        abstract = True

    _clone_excluded_fields = ['id', 'public_id']  # Exclude id and public_id from cloning

    def save(self, *args, **kwargs):
        if not self.public_id:
            self.public_id = public_id(self.__class__.__name__, self.id)
        super().save(*args, **kwargs)

    def make_clone(self, attrs=None, **kwargs):
        defaults = {'id': uuid7()}  # Generate a new id for the clone
        if 'new_workspace' in kwargs:
            defaults['workspace'] = kwargs.pop('new_workspace')
        defaults.update(attrs or {})
        clone = super().make_clone(attrs=defaults, **kwargs)
        clone.public_id = public_id(clone.__class__.__name__, clone.id)
        clone.save()
        return clone

    @classmethod
    def clone_workspace_related(cls, old_workspace, new_workspace):
        objects = cls.objects.filter(workspace=old_workspace)
        for obj in objects:
            obj.make_clone(new_workspace=new_workspace)