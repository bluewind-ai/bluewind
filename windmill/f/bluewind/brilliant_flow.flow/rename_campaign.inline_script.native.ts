// Since no imports are allowed, we assume a global fetch API is available in the runtime environment

export async function main(campaign_id: number, smartlead_api_key: string, campaign_name: string) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  // Construct the URL with the API key as a query parameter
  const url = `https://server.smartlead.ai/api/v1/campaigns/${campaign_id}/settings?api_key=${smartlead_api_key}`;
  // Use the fetch API to make a POST request
  const response = await fetch(url, {
    method: 'POST', // Specify the method
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: campaign_name })
  });
  return await response.json();

}