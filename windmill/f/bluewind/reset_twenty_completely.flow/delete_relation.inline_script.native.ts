export async function main(twenty: Object, relation_to_delete: string) {
  const query = `mutation DeleteOneRelationMetadataItem($idToDelete: UUID!) {
  deleteOneRelation(input: {id: $idToDelete}) {
    id
    __typename
  }
}`;

  let variables = {
    idToDelete: relation_to_delete,
  };

  let response = await fetch(`${twenty.twenty_base_url}/metadata`, {
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
