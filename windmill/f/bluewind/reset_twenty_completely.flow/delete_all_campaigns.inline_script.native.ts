export async function main(twenty_api_key: string, campaigns_ids_to_delete: Array) {
  const query = `mutation DeleteManyCampaigns($filter: CampaignFilterInput!) {
  deleteCampaigns(filter: $filter) {
    id
    __typename
  }
}`;

  let variables = {
    "filter": {
      "id": {
        "in": campaigns_ids_to_delete
      }
    }
  };

  let response = await fetch('https://api.twenty.com/graphql', {
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