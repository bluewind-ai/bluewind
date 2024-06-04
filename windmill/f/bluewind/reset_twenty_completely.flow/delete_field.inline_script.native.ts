export async function main(twenty_api_key: string, field_to_delete_id: string) {
  const url = `https://api.twenty.com/rest/metadata/fields/${field_to_delete_id}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`
    }
  });

  return await response.json();
}