// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(twenty_api_key: string, campaign_obect_metadata: string) {
  const mutation = `
    mutation CreateOneFieldMetadataItem($input: CreateOneFieldMetadataInput!) {
      createOneField(input: $input) {
        id
        type
      }
    }
  `;

  const variables = {
    input: {
      field: {
        description: null,
        icon: "IconUsers",
        label: "Smartlead Campaign Id",
        name: "smartleadCampaignId",
        objectMetadataId: campaign_obect_metadata,
        type: "TEXT"
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

      throw new Error(`HTTP error! status: ${response.status} error: ${JSON.stringify(data.errors, null, 2)}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}