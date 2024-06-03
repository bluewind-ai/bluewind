export async function main(twenty_api_key: string, campaign_people_ids_to_delete: Array) {
  const query = `mutation DeleteManyCampaignsPeople($filter: CampaignPersonFilterInput!) {
  deleteCampaignsPeople(filter: $filter) {
    id
    __typename
  }
}`;

  let variables = {
    "filter": {
      "id": {
        "in": campaign_people_ids_to_delete
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