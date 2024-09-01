from django.core.exceptions import ValidationError

PREFIX_MAPPINGS = {
    "Workspace": "wks",
    "Person": "person",
    "Channel": "channel",
    "User": "user",
    "LogEntry": "logentry",
    "Permission": "perm",
    "Group": "group",
    "ContentType": "ctype",
    "Session": "session",
    "ApiProvider": "apiprov",
    "ApiKey": "apikey",
    "WorkspaceUser": "wksuser",
    "Message": "msg",
    "ApolloPeopleSearch": "apsearch",
    "GmailSubscription": "gmailsub",
    "Assignment": "assignment",
    "EmailAddress": "email",
    "EmailConfirmation": "emailconf",
    "SocialApp": "socapp",
    "SocialAccount": "socacc",
    "SocialToken": "soctok",
    "Site": "site",
}


def public_id(model_name, id):
    if model_name not in PREFIX_MAPPINGS:
        raise ValidationError(f"You didn't give a prefix for the model: {model_name}")

    prefix = PREFIX_MAPPINGS[model_name]

    return f"{prefix}_{str(id).replace('-', '')[-12:]}"
