from django import forms
from django.db import models
from workspaces.models import WorkspaceRelated


class Action(WorkspaceRelated):
    form = models.CharField(
        max_length=255
    )  # This will store the form class name as a string

    def get_form_class(self):
        return getattr(forms, self.form)

    def execute(self, form_data):
        # Implementation of execution logic
        pass

    def __str__(self):
        return f"Action: {self.form} for Workspace: {self.workspace}"
