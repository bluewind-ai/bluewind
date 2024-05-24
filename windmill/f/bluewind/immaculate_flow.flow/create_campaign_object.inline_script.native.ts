export async function main(twenty_api_key: string) {
  const query = `
    mutation CreateOneObjectMetadataItem($input: CreateOneObjectInput!) {
      createOneObject(input: $input) {
	      id
	      dataSourceId
        }
    }
`;

  let variables = {
    "input": {
      "object": {
        "description": "",
        "icon": "IconListNumbers",
        "labelPlural": "Campaigns",
        "labelSingular": "Campaign",
        "nameSingular": "campaign",
        "namePlural": "campaigns"
      }
    }
  };

  let response = await fetch('https://api.twenty.com/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,

    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  return await response.json()
}