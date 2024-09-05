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
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.view = ChannelWizardView.as_view()

    def dispatch(self, request, *args, **kwargs):
        return self.view(request, *args, **kwargs)


# Model
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

    def __str__(self):
        return f"Channel Wizard for {self.user} in {self.workspace}"


# Forms
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


# Wizard View
@method_decorator(staff_member_required, name="dispatch")
class ChannelWizardView(SessionWizardView):
    form_list = [ChannelSelectionForm, NewChannelForm]
    template_name = "channel_wizard/channel_wizard_form.html"

    def get_context_data(self, form, **kwargs):
        context = super().get_context_data(form=form, **kwargs)
        admin_site = getattr(self.request, "admin_site", None)
        if admin_site:
            context.update(admin_site.each_context(self.request))
        context["title"] = "Add Channel Wizard"
        return context

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

    def get_form_initial(self, step):
        initial = super().get_form_initial(step)
        if step == "1":
            selection_data = self.get_cleaned_data_for_step("0")
            if selection_data and selection_data["action"] == "select":
                channel = selection_data["existing_channel"]
                if channel:
                    initial.update(
                        {
                            "email": channel.email,
                            "user": channel.user,
                            "workspace": channel.workspace,
                        }
                    )
        return initial

    def process_step(self, form):
        if self.steps.current == "0":
            selection_data = form.cleaned_data
            if selection_data["action"] == "select":
                self.storage.extra_data["selected_channel"] = selection_data[
                    "existing_channel"
                ].id
        return super().process_step(form)

    def done(self, form_list, **kwargs):
        selection_form = form_list[0]
        new_channel_form = form_list[1]

        channel_wizard = ChannelWizard(
            user=self.request.user,
            workspace=new_channel_form.cleaned_data["workspace"],
            action=selection_form.cleaned_data["action"],
        )

        if selection_form.cleaned_data["action"] == "select":
            channel_wizard.channel = selection_form.cleaned_data["existing_channel"]
            messages.success(
                self.request,
                f"Selected existing channel: {channel_wizard.channel.email}",
            )
        else:
            new_channel = new_channel_form.save()
            channel_wizard.channel = new_channel
            channel_wizard.email = new_channel.email
            messages.success(self.request, f"Created new channel: {new_channel.email}")

        channel_wizard.save()

        return redirect("admin:channel_wizzard_channelwizard_changelist")


# Admin
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
