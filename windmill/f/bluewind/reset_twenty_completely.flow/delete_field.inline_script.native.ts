export async function main(twenty: Twenty, field_to_delete_id: string) {
  const url = `https://api.twenty.com/rest/metadata/fields/${field_to_delete_id}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
    },
  });

  return await response.json();
}
