export async function main(twenty: Object, data: Array) {
  const mutation = `
mutation CreateCampaignsPeople($input: [CampaignPersonCreateInput!]!) {
  createCampaignsPeople(data: $input) {
    id
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
