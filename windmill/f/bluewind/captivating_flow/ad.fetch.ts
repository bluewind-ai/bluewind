export async function main(hubspot_access_token: string) {
  const url = `https://api.hubapi.com/crm/v3/objects/contacts?limit=1`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hubspot_access_token}`
    },
  });
  return await response.json();
}