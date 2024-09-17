from entity.models import Entity


def no_anonymous_users_allowed_outside_of_anonymous_workspace(workspace):
    """
    Retrieves up to 10 occurrences of an anonymous user (user_id=2) in the specified workspace.

    Args:
        workspace (Workspace): The workspace instance to check.
        limit (int): The maximum number of records to retrieve.

    Returns:
        list: A list of up to 10 occurrences of the anonymous user, or an empty list if none found.
    """
    # Assuming the anonymous user has user_id=2
    anonymous_user_id = 2

    # Query to find up to 10 occurrences of the anonymous user in the given workspace
    anonymous_users = list(
        Entity.objects.filter(workspace=workspace, user_id=anonymous_user_id)[:10]
    )  # ORM functionality to limit results to at most 'limit' records

    return anonymous_users
