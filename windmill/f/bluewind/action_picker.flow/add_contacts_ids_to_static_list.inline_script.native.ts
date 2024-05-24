export async function main(contactIds: [], staticListId: number, hubspot_access_token: string): Promise<number> {
  const url = `https://api.hubapi.com/contacts/v1/lists/${staticListId}/add`;

  const requestBody = {
    vids: contactIds,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hubspot_access_token}`,
    },
    body: JSON.stringify(requestBody),
  });
  return response.json()
}