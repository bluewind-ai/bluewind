export async function main(twenty: Twenty, data: Array) {
  const mutation = `
mutation CreatePeople($input: [PersonCreateInput!]!) {
  createPeople(data: $input) {
    id
    tags
  }
}
`;

  const variables = {
    input: data,
  };

  const response = await fetch(`${twenty.twenty_base_url}/graphql`, {
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
