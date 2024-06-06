export async function main(idToUpdate: string, twenty: Object) {
  const mutation = `
mutation UpdateOneObjectMetadataItem($idToUpdate: UUID!, $updatePayload: UpdateObjectPayload!) {
  updateOneObject(input: { id: $idToUpdate, update: $updatePayload }) {
    id
  }
}`;

  const variables = {
    idToUpdate,
    updatePayload: {
      isActive: false,
    },
  };

  const response = await fetch(`${twenty.twenty_base_url}/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables,
    }),
  });
  return await response.json();
}
