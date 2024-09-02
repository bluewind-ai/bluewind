# models.py
import logging
import uuid

from model_clone import CloneMixin

from bluewind.utils import uuid7
from django.db import models
from public_id.models import public_id

logger = logging.getLogger(__name__)


class BaseModel(CloneMixin, models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    public_id = models.CharField(max_length=100, unique=True, editable=False)

    class Meta:
        abstract = True

    _clone_excluded_fields = [
        "id",
        "public_id",
    ]  # Exclude id and public_id from cloning

    def save(self, *args, **kwargs):
        if not self.public_id:
            self.public_id = public_id(self.__class__.__name__, self.id or uuid7())
        super().save(*args, **kwargs)

    def make_clone(self, attrs=None, **kwargs):
        logger.info(f"Starting clone of {self.__class__.__name__} with id {self.id}")
        defaults = {"id": uuid7()}
        logger.info(f"New id for clone: {defaults['id']}")
        if "new_workspace" in kwargs:
            defaults["workspace"] = kwargs.pop("new_workspace")
            logger.info(f"New workspace for clone: {defaults['workspace']}")
        defaults.update(attrs or {})

        new_public_id = f"{self.__class__.__name__.lower()}_{uuid.uuid4().hex[:12]}"
        defaults["public_id"] = new_public_id
        logger.info(f"New public_id for clone: {new_public_id}")

        logger.info(f"Cloning with defaults: {defaults}")
        clone = super().make_clone(attrs=defaults, **kwargs)
        logger.info(f"Clone created with id: {clone.id}, public_id: {clone.public_id}")
        return clone

    @classmethod
    def clone_workspace_related(cls, old_workspace, new_workspace):
        logger.info(
            f"Starting to clone {cls.__name__} objects from workspace {old_workspace} to {new_workspace}"
        )
        objects = cls.objects.filter(workspace=old_workspace)
        logger.info(f"Found {objects.count()} {cls.__name__} objects to clone")
        for obj in objects:
            logger.info(
                f"Cloning {cls.__name__} object with id: {obj.id}, public_id: {obj.public_id}"
            )
            cloned_obj = obj.make_clone(new_workspace=new_workspace)
            logger.info(
                f"Cloned {cls.__name__} object. Original id: {obj.id}, Clone id: {cloned_obj.id}"
            )
        logger.info(
            f"Finished cloning {cls.__name__} objects for workspace {old_workspace}"
        )
