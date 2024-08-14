from django.db import models
import random
from django.core.exceptions import ValidationError

class PublicIDField(models.BigIntegerField):
    def __init__(self, *args, **kwargs):
        kwargs['unique'] = True
        kwargs['editable'] = False
        super().__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        if add and not getattr(model_instance, self.attname):
            value = self.generate_public_id(model_instance.__class__)
            setattr(model_instance, self.attname, value)
            return value
        return super().pre_save(model_instance, add)

    @staticmethod
    def generate_public_id(model_class):
        max_attempts = 3
        for attempt in range(max_attempts):
            new_id = random.randint(1000000000, 9999999999)
            if not model_class.objects.filter(public_id=new_id).exists():
                return new_id
        raise ValidationError(f"Failed to generate a unique ID after {max_attempts} attempts")