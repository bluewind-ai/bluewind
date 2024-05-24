export async function main(hubspot_api_key: string, list_name: string): Promise<void> {
  const endpointUrl = 'https://api.hubapi.com/contacts/v1/lists';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${hubspot_api_key}`,
  };

  const payload = {
    name: list_name,
    dynamic: false,
    description: "tes"
  };

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });
  return response.json();
}
