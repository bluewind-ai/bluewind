// Since no imports are allowed, we assume a global fetch API is available in the runtime environment
// Since no imports are allowed, we assume a global fetch API is available in the runtime environment
export async function main(campaign_id: number, smartlead_api_key: string) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  // Construct the URL with the API key as a query parameter
  const url = `https://server.smartlead.ai/api/v1/campaigns/${campaign_id}/sequences?api_key=${smartlead_api_key}`;
  const jsonBody = {
    "sequences": [
      {
        "seq_number": 1,
        "seq_delay_details": {
          "delay_in_days": 1
        },
        "seq_variants": [
          {
            "subject": "{{Message_1_Subject}}",
            "email_body": "{{Message_1_Body}}",
            "variant_label": "A"
          }
        ]
      }
    ]
  }
  // Use the fetch API to make a POST request
  const response = await fetch(url, {
    method: 'POST', // Specify the method
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonBody),
  });

  // Await and return the JSON response
  return await response.json();
}

