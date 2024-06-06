export async function main(twenty: Object) {
  const url = `https://api.twenty.com/rest/campaigns`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
    },
  });

  return await response.json();
}
