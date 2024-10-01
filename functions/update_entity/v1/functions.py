# Assuming these are defined elsewhere
from django.db import models

from bluewind.context_variables import get_workspace_id
from bluewind.do_not_log import DO_NOT_LOG
from functions.select_or_create_model.v1.functions import select_or_create_model_v1


def update_entity_v1(instance):
    from entities.models import Entity

    model_str = f"{instance._meta.app_label}.{instance._meta.object_name}"

    if model_str in DO_NOT_LOG:
        return
    model = select_or_create_model_v1(instance)

    content_type = instance.get_model_instance()
    name = str(instance)[:255]  # Truncate to 255 characters

    Entity.objects.update_or_create(
        workspace_id=get_workspace_id,
        content_type=content_type,
        object_id=instance.pk,
        defaults={
            "name": name,
            "updated_at": models.functions.Now(),
            "user": instance.user,
        },
    )
