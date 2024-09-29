import json

from django.db.models.query import QuerySet
from django.forms import model_to_dict


def serialize_form_data_v1(form):
    seralized_data = {}
    form.is_valid()
    for field, value in form.cleaned_data.items():
        if isinstance(value, list):
            seralized_data[field] = list(map(model_to_dict, list(value)))
        elif isinstance(value, dict):
            seralized_data[field] = model_to_dict(value)
        elif isinstance(value, (int, str, bool, float)):
            seralized_data[field] = value
        elif isinstance(value, QuerySet):
            seralized_data[field] = [
                model_to_dict(item) if hasattr(item, "_meta") else item
                for item in value
            ]
        elif isinstance(value, object):
            seralized_data[field] = model_to_dict(value)
        else:
            raise Exception("type not covered", field, value)

    raise Exception(json.dumps(seralized_data))
