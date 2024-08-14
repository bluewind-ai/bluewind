import base64
from datetime import timezone
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv
from django.contrib.auth.models import User

# Load environment variables
load_dotenv()

# Print current working directory and client secret file path for debugging
print("Current working directory:", os.getcwd())
print("GMAIL_CLIENT_SECRET_FILE:", os.getenv('GMAIL_CLIENT_SECRET_FILE'))

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_gmail_service():
    creds = None
    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            client_secret_file = os.path.expanduser(os.getenv('GMAIL_CLIENT_SECRET_FILE'))
            flow = InstalledAppFlow.from_client_secrets_file(
                client_secret_file, SCOPES)
            creds = flow.run_local_server(port=8080)  # Use a fixed port
        
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    service = build('gmail', 'v1', credentials=creds)
    return service

def list_labels():
    service = get_gmail_service()
    try:
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])

        if not labels:
            print('No labels found.')
        else:
            print('Labels:')
            for label in labels:
                print(label['name'])
    except Exception as e:
        print(f"An error occurred: {e}")

def create_messages_from_gmail():
    from chat_messages.models import Message

    service = get_gmail_service()
    try:
        results = service.users().messages().list(userId='me', maxResults=10).execute()
        messages = results.get('messages', [])

        if not messages:
            print('No messages found.')
            return

        # Ensure we have at least one user
        user, created = User.objects.get_or_create(username='gmail_user')

        for message in messages:
            msg = service.users().messages().get(userId='me', id=message['id']).execute()
            
            # Get email subject
            subject = next((header['value'] for header in msg['payload']['headers'] if header['name'] == 'Subject'), 'No Subject')
            
            # Get sender
            sender = next((header['value'] for header in msg['payload']['headers'] if header['name'] == 'From'), 'Unknown')
            
            # Get email body
            if 'parts' in msg['payload']:
                body = base64.urlsafe_b64decode(msg['payload']['parts'][0]['body']['data']).decode('utf-8')
            else:
                body = base64.urlsafe_b64decode(msg['payload']['body']['data']).decode('utf-8')
            
            # Create Message object
            Message.objects.create(
                sender=user,
                recipient=user,
                subject=subject[:255],  # Limit subject to 255 characters
                content=body,
                timestamp=timezone.now(),
                is_read=False
            )

        print("10 messages created successfully from Gmail!")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    get_last_10_emails()