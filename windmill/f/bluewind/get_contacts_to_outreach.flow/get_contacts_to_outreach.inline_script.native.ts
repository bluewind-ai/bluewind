export async function main(twenty_api_key: string, campaign_id: string, number_of_contacts_needed: number) {
  const query = `query FindManyCampaignsPeople($filter: CampaignPersonFilterInput) {
  campaignsPeople(first: ${number_of_contacts_needed}, filter: $filter) {
    edges {
      node {
        id
        campaignStatus
        isPipelineProcessed
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
          isEmailCatchAll
          isEmailValid

        }
      }
    }
  }
}`;

  let variables = {
    "filter": {
      "isPipelineProcessed": {
        "eq": false
      },
      "campaignId": {
        "eq": campaign_id
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