// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(
  twenty_api_key: string,
  campaign_people_object_id: string,
  person_object_id: string
) {
  const mutation = `
mutation CreateOneRelationMetadata($input: CreateOneRelationInput!) {
  createOneRelation(input: $input) {
    id
    relationType
    fromObjectMetadataId
    toObjectMetadataId
    fromFieldMetadataId
    toFieldMetadataId
    createdAt
    updatedAt
    __typename
  }
}
`;

  const variables = {
    input: {
      relation: {
        "fromIcon": "IconUsers",
        "fromLabel": "person",
        "fromName": "person",
        "fromObjectMetadataId": campaign_people_object_id,
        "relationType": "ONE_TO_MANY",
        "toIcon": "IconAds",
        "toLabel": "campaigns",
        "toName": "campaigns",
        "toObjectMetadataId": person_object_id
      }
    }
  };

  try {
    const response = await fetch('https://api.twenty.com/metadata', {
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

    if (!response.ok) {
      const data = await response.json();
      return data
      throw new Error(`HTTP error! status: ${response.status} error: ${JSON.stringify(data.errors, null, 2)}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}