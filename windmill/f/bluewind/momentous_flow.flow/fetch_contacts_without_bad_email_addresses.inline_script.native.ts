export async function main(apiKey: string) {
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/search`;

  const requestBody = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'is_email_valid',
            operator: 'NOT_HAS_PROPERTY',
          },
          {
            propertyName: 'email',
            operator: 'HAS_PROPERTY',
          },
          {
            propertyName: 'is_catch_all',
            operator: 'NOT_HAS_PROPERTY',
          },
        ],
      },
    ],
    limit: 10, // Increase the limit to retrieve more contacts
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (response.ok) {
    const data = await response.json();
    const contacts = data.results;

    if (contacts.length > 0) {
      const randomIndex = Math.floor(Math.random() * contacts.length);
      const randomContact = contacts[randomIndex];
      return randomContact;
    } else {
      throw new Error('No contacts found.');
    }
  } else {
    throw new Error(`Error retrieving contacts: ${response.status}`);
  }
}