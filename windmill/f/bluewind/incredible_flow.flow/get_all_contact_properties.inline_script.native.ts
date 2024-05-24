// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(hubspot_access_token: string) {
  const url = 'https://api.hubapi.com/properties/v1/contacts/properties';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${hubspot_access_token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json()
}
