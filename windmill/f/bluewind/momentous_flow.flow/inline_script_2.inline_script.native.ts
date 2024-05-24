// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(apiKey: string, contactId: string) {
  const url = `https://api.hubapi.com/contacts/v1/contact/vid/${contactId}/profile`;

  const data = {
    properties: [
      {
        property: "is_catch_all",
        value: "true",
      },
    ],
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });
}
