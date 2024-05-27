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

  let variables = {
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