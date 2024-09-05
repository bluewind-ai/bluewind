from formtools.wizard.views import SessionWizardView

from base_model_admin.admin import InWorkspace
from channels.models import Channel
from django import forms
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.db import models
from django.shortcuts import redirect
from django.urls import path
from django.utils.decorators import method_decorator
from django.views import View
from users.models import User
from workspaces.models import Workspace, WorkspaceRelated, WorkspaceUser


class ChannelWizardWrapper(View):
    def dispatch(self, request, *args, **kwargs):
        return ChannelWizardView.as_view()(request, *args, **kwargs)


class ChannelWizard(WorkspaceRelated):
    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, null=True, blank=True
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    action = models.CharField(
        max_length=10,
        choices=[
            ("select", "Select Existing Channel"),
            ("create", "Create New Channel"),
        ],
    )
    email = models.EmailField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ChannelSelectionForm(forms.Form):
    action = forms.ChoiceField(
        choices=[
            ("select", "Select Existing Channel"),
            ("create", "Create New Channel"),
        ],
        widget=forms.RadioSelect,
    )
    existing_channel = forms.ModelChoiceField(
        queryset=Channel.objects.none(), required=False
    )


class NewChannelForm(forms.ModelForm):
    class Meta:
        model = Channel
        fields = ["email", "user", "workspace"]

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)
        if user:
            workspace_ids = WorkspaceUser.objects.filter(user=user).values_list(
                "workspace_id", flat=True
            )
            self.fields["workspace"].queryset = Workspace.objects.filter(
                id__in=workspace_ids
            )


@method_decorator(staff_member_required, name="dispatch")
class ChannelWizardView(SessionWizardView):
    form_list = [ChannelSelectionForm, NewChannelForm]
    template_name = "channel_wizard/channel_wizard_form.html"

    def get_form_kwargs(self, step=None):
        kwargs = super().get_form_kwargs(step)
        if step == "1":
            kwargs["user"] = self.request.user
        return kwargs

    def get_form(self, step=None, data=None, files=None):
        form = super().get_form(step, data, files)
        if step == "0":
            workspace_ids = WorkspaceUser.objects.filter(
                user=self.request.user
            ).values_list("workspace_id", flat=True)
            form.fields["existing_channel"].queryset = Channel.objects.filter(
                workspace_id__in=workspace_ids
            )
        return form

    def process_step(self, form):
        step_data = self.get_form_step_data(form)

        if self.steps.current == "0":
            # For the first step, create or update the ChannelWizard instance
            action = form.cleaned_data["action"]
            channel_wizard, created = ChannelWizard.objects.update_or_create(
                user=self.request.user,
                defaults={
                    "action": action,
                    "workspace": form.cleaned_data["existing_channel"].workspace
                    if action == "select"
                    else None,
                    "channel": form.cleaned_data["existing_channel"]
                    if action == "select"
                    else None,
                },
            )
        elif self.steps.current == "1":
            # For the second step, update the existing ChannelWizard instance
            channel_wizard = ChannelWizard.objects.get(user=self.request.user)
            channel_wizard.workspace = form.cleaned_data["workspace"]
            channel_wizard.email = form.cleaned_data["email"]
            channel_wizard.save()

        return step_data

    def done(self, form_list, **kwargs):
        channel_wizard = ChannelWizard.objects.get(user=self.request.user)

        if channel_wizard.action == "create":
            new_channel_form = form_list[1]
            new_channel = new_channel_form.save()
            channel_wizard.channel = new_channel
            channel_wizard.email = new_channel.email
            channel_wizard.save()
            messages.success(self.request, f"Created new channel: {new_channel.email}")
        else:
            messages.success(
                self.request,
                f"Selected existing channel: {channel_wizard.channel.email}",
            )

        return redirect("admin:channel_wizzard_channelwizard_changelist")


class ChannelWizardAdmin(InWorkspace):
    list_display = ("user", "workspace", "action", "created_at")

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "add/",
                self.admin_site.admin_view(ChannelWizardWrapper.as_view()),
                name="channelwizard_add",
            ),
        ]
        return custom_urls + urls

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        workspace_ids = WorkspaceUser.objects.filter(user=request.user).values_list(
            "workspace_id", flat=True
        )
        return qs.filter(workspace_id__in=workspace_ids)
