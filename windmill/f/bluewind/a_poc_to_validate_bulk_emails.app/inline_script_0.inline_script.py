import wmill
import requests
import re

def extract_emails_from_spreadsheet(spreadsheet_url, token):
    spreadsheet_id = spreadsheet_url.split("/d/")[1].split("/")[0]
    range_name = 'Sheet1!A:A'
    GET_VALUES_URL = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range_name}"

    response = requests.get(
        GET_VALUES_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to retrieve data: {response.text}")
    
    values = response.json().get('values', [])
    
    emails = [item for sublist in values for item in sublist]
    
    email_regex = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    
    email_list = [email for email in emails if re.match(email_regex, email)]
    
    return email_list


def verify_emails(email_list, api_key):
    verified_emails = []
    for email in email_list:
        url = f"https://api.millionverifier.com/api/v3/?api={api_key}&email={email}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            print(data)
            if data['result'] == 'ok':
                verified_emails.append(email)
    return verified_emails


def create_google_sheet(verified_emails, token):
    CREATE_SHEET_URL = "https://sheets.googleapis.com/v4/spreadsheets"
    
    payload = {
        "properties": {
            "title": "Verified Emails"
        }
    }
    
    response = requests.post(
        CREATE_SHEET_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json=payload
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to create Google Sheet: {response.text}")
    
    spreadsheet_id = response.json()['spreadsheetId']
    
    APPEND_VALUES_URL = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/A1:append?valueInputOption=USER_ENTERED"
    
    payload = {
        "values": [[email] for email in verified_emails]
    }
    
    response = requests.post(
        APPEND_VALUES_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json=payload
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to append values to Google Sheet: {response.text}")
    
    return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"

def main(x: str):
    service_account_info = wmill.get_resource("u/donald/energy_efficient_gsheets")

    if service_account_info is None:
        raise ValueError("Failed to retrieve service account information. Check the resource path and permissions.")

    token = service_account_info['token']

    email_list = extract_emails_from_spreadsheet(x, token)
    api_key = wmill.get_variable("u/donald/MillionVerifierAPIKey")
    print(api_key)

    verified_emails = verify_emails(email_list, api_key)
    
    google_sheet_url = create_google_sheet(verified_emails, token)
    
    return {'verified_emails': verified_emails, 'google_sheet_url': google_sheet_url}