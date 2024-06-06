export async function main(twenty: Twenty, field_metadata: Object) {
  const mutation = `
    mutation CreateOneFieldMetadataItem($input: CreateOneFieldMetadataInput!) {
      createOneField(input: $input) {
        id
        type
      }
    }
  `;

  const variables = {
    input: {
      field: field_metadata,
    },
  };

  const response = await fetch(`${twenty.twenty_base_url}/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables,
    }),
  });
  return await response.json();
}
