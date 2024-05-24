// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(hubspot_access_token: string, import_id: string) {
  const response = await fetch(`https://api.hubapi.com/crm/v3/imports/${import_id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${hubspot_access_token}`,
      'Content-Type': 'application/json',
    },
  });
  return await response.json()
}