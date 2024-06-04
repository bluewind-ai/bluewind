export async function main(idToUpdate: string, twenty_api_key: string) {
  const mutation = `
mutation UpdateOneObjectMetadataItem($idToUpdate: UUID!, $updatePayload: UpdateObjectPayload!) {
  updateOneObject(input: { id: $idToUpdate, update: $updatePayload }) {
    id
  }
}`;

  let variables = {
    idToUpdate,
    updatePayload: {
      isActive: false
    }
  };

  let response = await fetch('https://api.twenty.com/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables
    })
  });
  return await response.json();

}


