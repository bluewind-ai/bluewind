// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(
  twenty: Twenty,
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
        fromDescription: null,
        fromIcon: 'IconAds',
        fromLabel: 'campaigns',
        fromName: 'campaigns',
        fromObjectMetadataId: person_object_id,
        relationType: 'ONE_TO_MANY',
        toDescription: null,
        toIcon: 'IconUsers',
        toLabel: 'person',
        toName: 'person',
        toObjectMetadataId: campaign_people_object_id,
      },
    },
  };

  try {
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

    if (!response.ok) {
      const data = await response.json();
      return data;
      throw new Error(
        `HTTP error! status: ${response.status} error: ${JSON.stringify(data.errors, null, 2)}`
      );
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
