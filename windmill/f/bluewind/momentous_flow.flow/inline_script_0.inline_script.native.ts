export async function main(apiKey: string, contactId: string) {
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;

  const data = {
    properties: {
      is_email_valid: "true"
    }
  };

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const updatedContact = await response.json();
    console.log('Contact updated:', updatedContact);
  } else {
    console.error('Error updating contact:', response.status, response.statusText);
  }
}