from django.db import models
import random
from django.core.exceptions import ValidationError

PREFIX_MAPPINGS = {
    "Workspace": "wks",
    "Person": "person"
    # Add other model names and their corresponding prefixes here
}

def public_id(model_name, id):
    if model_name not in PREFIX_MAPPINGS:
        raise ValidationError(f"You didn't give a prefix for the model: {model_name}")
    
    prefix = PREFIX_MAPPINGS[model_name]

    return f"{prefix}_{str(id).replace('-', '')[-12:]}"