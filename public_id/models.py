from nanoid import generate

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


def public_id():
    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    return f"wks_{generate(alphabet, 5)}"
