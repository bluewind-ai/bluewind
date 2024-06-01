export async function main(twenty_api_key: string) {
  const query = `query FindManyPeople($filter: PersonFilterInput) {
  people(filter: $filter) {
    totalCount
    __typename
  }
}
`;

  let variables = {
    "filter": {
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