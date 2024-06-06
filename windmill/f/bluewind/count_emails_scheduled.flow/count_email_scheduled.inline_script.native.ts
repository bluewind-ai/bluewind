export async function main(twenty: Object) {
  const query = `query FindManyCampaignsPeople($filter: CampaignPersonFilterInput) {
  campaignsPeople(filter: $filter) {
    totalCount
    __typename
  }
}
`;

  const variables = {
    filter: {
      campaignStatus: {
        in: ['EMAIL_SCHEDULED'],
      },
    },
  };

  const response = await fetch(`${twenty.twenty_base_url}/graphql`, {
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