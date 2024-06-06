export async function main(
  twenty: Twenty,
  campaign_id: string,
  number_of_contacts_needed: number
) {
  const query = `query FindManyCampaignsPeople($filter: CampaignPersonFilterInput) {
  campaignsPeople(first: ${number_of_contacts_needed}, filter: $filter) {
    edges {
      node {
        id
        tags
        person {
          name {
            firstName
            lastName
          }
          email
          linkedinLink {
            label
            url
          }
          jobTitle
          phone
          city
          avatarUrl
          position
          id
          createdAt
          updatedAt
          companyId
          tags
        }
      }
    }
  }
}`;

  const variables = {
    filter: {
      tagsFlattened: { ilike: '%csdcds%' },
      campaignId: {
        eq: campaign_id,
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
