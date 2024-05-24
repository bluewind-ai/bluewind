export async function main(hubspot_api_key: string) {
  const url = 'https://api.hubapi.com/crm/v3/lists/search';

  const headers = {
    'Authorization': `Bearer ${hubspot_api_key}`,
    'Content-Type': 'application/json',
  };

  const data = {
    "additionalProperties": [
      "hs_description"
    ],

  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const result = await response.json();
  const bluewindSecretsList = result.lists.find(list => list.name === 'bluewind_secrets');

  return bluewindSecretsList
}