export async function main(twenty: Twenty, people_ids_to_delete: Array) {
  const query = `mutation DeleteManyPeople($filter: PersonFilterInput!) {
  deletePeople(filter: $filter) {
    id
    __typename
  }
}`;

  let variables = {
    filter: {
      id: {
        in: people_ids_to_delete,
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
