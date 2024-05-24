export async function main(twenty_api_key: string) {
  const url = `https://api.twenty.com/rest/campaigns`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`
    }
  });

  return await response.json();
}