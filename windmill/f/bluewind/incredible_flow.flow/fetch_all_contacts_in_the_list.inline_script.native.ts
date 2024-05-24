export async function main(apiKey: string, import_id: string) {
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/search`;

  const requestBody = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'import_id',
            operator: 'EQ',
            value: import_id,
          },
          {
            propertyName: 'enrichment_pipeline_finished',
            operator: 'NOT_HAS_PROPERTY',
          }
        ],
      },
    ],
    properties: [
      "is_email_valid"
      , "is_catch_all"
      , "first_name"
      , "last_name"
      , "linkedin_url"
      , "email"
    ],
    limit: 2,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  return await response.json()
}