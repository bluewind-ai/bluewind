import json

from django.db.models.query import QuerySet
from django.forms import model_to_dict


def serialize_form_data_v1(form):
    serialized_data = {}
    form.is_valid()
    for field, value in form.cleaned_data.items():
        if isinstance(value, list):
            serialized_data[field] = list(map(model_to_dict, list(value)))
        elif isinstance(value, dict):
            serialized_data[field] = model_to_dict(value)
        elif isinstance(value, (int, str, bool, float)):
            serialized_data[field] = value
        elif isinstance(value, QuerySet):
            serialized_data[field] = [
                model_to_dict(item) if hasattr(item, "_meta") else item
                for item in value
            ]
        elif isinstance(value, object):
            serialized_data[field] = value.id
        else:
            raise Exception("type not covered", field, value)

    raise Exception(json.dumps(serialized_data))
