export async function main(twenty_api_key: string, campaign_name: string, page_size: number) {
  const query = `query FindManyPeople($filter: PersonFilterInput) {
  people(filter: $filter, first: ${page_size}) {
    totalCount
    __typename
    edges {
      node {
        	name {
          firstName
          lastName
        }
        email
          linkedinLink{
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
        campaignStatus
        isEmailValid
        campaignName
      }
    }
  }
}
`;

  let variables = {
    "filter": {
      "campaignStatus": {
        "in": [
          "SOURCED"
        ]
      },
      "campaignName": {
        "eq":
          campaign_name
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
