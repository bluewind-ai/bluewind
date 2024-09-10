from base_model_admin.admin import InWorkspace
from credentials.models import CredentialsForm

# Register your models here.


class CredentialsAdmin(InWorkspace):
    form = CredentialsForm
