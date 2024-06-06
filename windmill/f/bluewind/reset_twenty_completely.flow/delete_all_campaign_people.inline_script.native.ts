export async function main(
  twenty: Object,
  campaign_people_ids_to_delete: Array
) {
  const query = `mutation DeleteManyCampaignsPeople($filter: CampaignPersonFilterInput!) {
  deleteCampaignsPeople(filter: $filter) {
    id
    __typename
  }
}`;

  let variables = {
    filter: {
      id: {
        in: campaign_people_ids_to_delete,
      },
    },
  };

  let response = await fetch(`${twenty.twenty_base_url}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  return await response.json();
}
