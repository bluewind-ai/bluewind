// Fetch-only script, no imports allowed (except windmill) but benefits from a dedicated highly efficient runtime
//import * as wmill from './windmill.ts'

export async function main(idToUpdate: string, updatePayload: Object, twenty_api_key: string) {
  const mutation = `
    mutation UpdateOneFieldMetadataItem($idToUpdate: UUID!, $updatePayload: UpdateFieldInput!) {
      updateOneField(input: {id: $idToUpdate, update: $updatePayload}) {
        id
      }
    }
  `;

  let variables = {
    idToUpdate,
    updatePayload
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
