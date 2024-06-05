export async function main(twenty_api_key: string, data: Array) {
  const mutation = `
mutation CreatePeople($input: [PersonCreateInput!]!) {
  createPeople(data: $input) {
    id
    tags
  }
}
`;

  let variables = {
    "input": data
  };

  let response = await fetch('https://api.twenty.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables
    })
  });
  return await response.json();

}