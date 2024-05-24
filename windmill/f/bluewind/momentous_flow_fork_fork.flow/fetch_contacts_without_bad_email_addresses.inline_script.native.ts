export async function main(apiKey: string, hubspot_list_id: string) {
  const url = `https://api.hubapi.com/contacts/v1/lists/${hubspot_list_id}/contacts/all?count=1&property=email&property=firstname&property=lastname&property=company&property=linkedin_url`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();
  return data;
}