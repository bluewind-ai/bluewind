export async function main(twenty_api_key: string, people_ids_to_delete: Array) {
  const query = `mutation DeleteManyPeople($filter: PersonFilterInput!) {
  deletePeople(filter: $filter) {
    id
    __typename
  }
}`;

  let variables = {
    "filter": {
      "id": {
        "in": people_ids_to_delete
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
  const data = await response.json()

  return data.data.people.edges.map(obj => obj.node.id);

}