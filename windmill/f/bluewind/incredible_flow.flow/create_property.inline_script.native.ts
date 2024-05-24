// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(property: Object, hubspot_access_token: string) {

  const url = `https://api.hubapi.com/crm/v3/properties/contacts`;

  const headers = {
    Authorization: `Bearer ${hubspot_access_token}`,
    "Content-Type": "application/json",
  };


  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(property),
  });

  return await response.json()
}
