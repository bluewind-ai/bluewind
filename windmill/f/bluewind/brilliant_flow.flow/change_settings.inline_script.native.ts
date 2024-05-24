// Since no imports are allowed, we assume a global fetch API is available in the runtime environment
// Since no imports are allowed, we assume a global fetch API is available in the runtime environment
export async function main(campaign_id: number, smartlead_api_key: string) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  // Construct the URL with the API key as a query parameter
  const url = `https://server.smartlead.ai/api/v1/campaigns/${campaign_id}/schedule?api_key=${smartlead_api_key}`;

  const jsonBody = {
    "timezone": "America/Los_Angeles",
    "days_of_the_week": [1, 2, 3, 4, 5],
    "start_hour": "06:00",
    "end_hour": "12:00",
    "min_time_btw_emails": 9,
    "max_new_leads_per_day": 100000
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

