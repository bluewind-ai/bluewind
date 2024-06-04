export async function main(twenty_api_key: string) {
  const query = `query FindManyCampaigns($filter: CampaignFilterInput) {
  campaigns(first: 1000, filter: $filter) {
    edges {
      node {
        id
        campaignStatus
        people {
          edges {
            node {
              id
              campaignStatus
            }
          }
        }
      }
    }
  }
}`;

  let variables = {
    "filter": {
      "campaignStatus": {
        "in": [
          "DRAFTED"
        ]
      }
    },
    "personFilter": {
      "campaignStatus": {
        "in": [
          "EMAIL_SCHEDULED"
        ]
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