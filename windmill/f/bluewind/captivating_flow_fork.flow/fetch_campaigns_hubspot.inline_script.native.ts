// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(hubspot_api_key: string) {
  const url = `https://api.hubapi.com/contacts/v1/lists/static?count=1000`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${hubspot_api_key}`,
    },
  });
  return await response.json();
}