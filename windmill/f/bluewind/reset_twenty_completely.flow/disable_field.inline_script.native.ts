export async function main(idToUpdate: string, twenty: Twenty) {
  const mutation = `
                                  mutation UpdateOneFieldMetadataItem($idToUpdate: UUID!, $updatePayload: UpdateFieldInput!) {
                                    updateOneField(input: {id: $idToUpdate, update: $updatePayload}) {
                                      id
                                    }
                                  }
                                `;

  let variables = {
    idToUpdate,
    updatePayload: {
      isActive: false,
    },
  };

  let response = await fetch(`${twenty.twenty_base_url}/metadata`, {
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
