from django.db import models
import random
from django.core.exceptions import ValidationError

PREFIX_MAPPINGS = {
    "Workspace": "wks",
    # Add other model names and their corresponding prefixes here
}

def public_id(model_name, id):
    assert model_name in PREFIX_MAPPINGS
    
    prefix = PREFIX_MAPPINGS[model_name]

    return f"{prefix}_{str(id).replace('-', '')[-12:]}"