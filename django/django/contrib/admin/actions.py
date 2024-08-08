"""
Built-in, globally-available admin actions.
"""

import uuid
from django.contrib import messages
from django.contrib.admin import helpers
from django.contrib.admin.decorators import action
from django.contrib.admin.utils import model_ngettext
from django.core.exceptions import PermissionDenied
from django.template.response import TemplateResponse
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy


@action(
    permissions=["delete"],
    description=gettext_lazy("Delete selected %(verbose_name_plural)s"),
)
def delete_selected(modeladmin, request, queryset):
    """
    Default action which deletes the selected objects.

    This action first displays a confirmation page which shows all the
    deletable objects, or, if the user has no permission one of the related
    childs (foreignkeys), a "permission denied" message.

    Next, it deletes all selected objects and redirects back to the change list.
    """
    opts = modeladmin.model._meta
    app_label = opts.app_label

    # Populate deletable_objects, a data structure of all related objects that
    # will also be deleted.
    (
        deletable_objects,
        model_count,
        perms_needed,
        protected,
    ) = modeladmin.get_deleted_objects(queryset, request)

    # The user has already confirmed the deletion.
    # Do the deletion and return None to display the change list view again.
    if request.POST.get("post") and not protected:
        if perms_needed:
            raise PermissionDenied
        n = len(queryset)
        if n:
            for obj in queryset:
                obj_display = str(obj)
                modeladmin.log_deletion(request, obj, obj_display)            

            # TODO, find a way to get workspace users and delete at the same time?
            # Get all WorkspaceUser objects for the selected workspaces
            
            new_func(request)
            
            modeladmin.delete_queryset(request, queryset)

            modeladmin.message_user(
                request,
                _("Successfully deleted %(count)d %(items)s.")
                % {"count": n, "items": model_ngettext(modeladmin.opts, n)},
                messages.SUCCESS,
            )
        # Return None to display the change list page again.
        return None

    objects_name = model_ngettext(queryset)

    if perms_needed or protected:
        title = _("Cannot delete %(name)s") % {"name": objects_name}
    else:
        title = _("Are you sure?")

    context = {
        **modeladmin.admin_site.each_context(request),
        "title": title,
        "subtitle": None,
        "objects_name": str(objects_name),
        "deletable_objects": [deletable_objects],
        "model_count": dict(model_count).items(),
        "queryset": queryset,
        "perms_lacking": perms_needed,
        "protected": protected,
        "opts": opts,
        "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
        "media": modeladmin.media,
        'workspace_id': 91017349113822292053236764842421211
    }

    request.current_app = modeladmin.admin_site.name

    # Display the confirmation page
    return TemplateResponse(
        request,
        modeladmin.delete_selected_confirmation_template
        or [
            "admin/%s/%s/delete_selected_confirmation.html"
            % (app_label, opts.model_name),
            "admin/%s/delete_selected_confirmation.html" % app_label,
            "admin/delete_selected_confirmation.html",
        ],
        context,
    )

def new_func(request):
    from django.contrib.auth.models import User
    from workspaces.models import WorkspaceUser
    # Extract user IDs from the WorkspaceUser queryset
    from user_sessions.models import Session
    from user_sessions.backends.db import SessionStore
    
    if 'workspaces/workspaceuser' in request.path:
        workspace_users_to_delete = request.POST.getlist('_selected_action')
        selected_workspace_ids = WorkspaceUser.objects.filter(id__in=workspace_users_to_delete).values_list('workspace_id', flat=True)
        selected_workspace_ids_display = [ str(workspace_id) for workspace_id in selected_workspace_ids]
    elif 'workspaces/workspace'in request.path:
        request.POST.getlist('_selected_action')
        selected_workspace_ids_display = request.POST.getlist('_selected_action')
        selected_workspace_ids = [uuid.UUID(id_str) for id_str in selected_workspace_ids_display]
    else:
        return None
    users = User.objects.filter(workspaceuser__workspace_id__in=selected_workspace_ids)
    
    user_ids = list(users.values_list('id', flat=True))

    sessions = Session.objects.filter(user_id__in=user_ids)
            
    # TODO wrap the deletion and the session logic in a transaction
    for session in sessions:
        try:
            store = SessionStore(session_key=session.session_key)

                    # Get the current workspaces
            current_workspaces = store.get('workspaces', [])

                    # Create a set of workspace IDs to be removed for faster lookup
            workspace_ids_to_remove = set()
            for id_str in selected_workspace_ids_display:
                workspace_ids_to_remove.add(str(uuid.UUID(id_str).int))

                    # Filter out the workspaces that need to be removed
            updated_workspaces = []
            for workspace in current_workspaces:
                if workspace['workspace_id'] not in workspace_ids_to_remove:
                    updated_workspaces.append(workspace)
            
            store['workspaces'] = updated_workspaces

                    # Save the changes
            store.save()
                    
        except Exception as e:
            print(f"Error processing session {session.session_key}: {str(e)}")
