export async function main(apiKey: string, contactId: string, properties_to_patch: object) {
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
  const mergedProperties = {
    ...properties_to_patch,
    enrichment_pipeline_finished: "true"
  };
  const data = {
    properties: mergedProperties
  };

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });

  return await response.json()
}