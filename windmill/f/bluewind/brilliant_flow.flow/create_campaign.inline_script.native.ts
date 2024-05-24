// Since no imports are allowed, we assume a global fetch API is available in the runtime environment

export async function main(smartlead_api_key: string) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  // Construct the URL with the API key as a query parameter
  const url = `https://server.smartlead.ai/api/v1/campaigns/create?api_key=${smartlead_api_key}`;

  // Use the fetch API to make a POST request
  const response = await fetch(url, {
    method: 'POST', // Specify the method
  });

  // Await and return the JSON response
  const data = await response.json();

  // Merge the two JSON objects
  const mergedData = {
    ...data,
    "campaign_url": `https://app.smartlead.ai/app/email-campaign/${data.id}`
  };

  return mergedData;
}