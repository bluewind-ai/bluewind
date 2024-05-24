export async function main(campaign_id: number, smartlead_api_key: string) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  // Construct the URL with the API key as a query parameter
  const url = `https://server.smartlead.ai/api/v1/campaigns/${campaign_id}/settings?api_key=${smartlead_api_key}`;

  const jsonBody = {
    "track_settings": ["DONT_TRACK_EMAIL_OPEN", "DONT_TRACK_LINK_CLICK"],
    "stop_lead_settings": "REPLY_TO_AN_EMAIL",
    "send_as_plain_text": true,
    "follow_up_percentage": 100,
    "enable_ai_esp_matching": false
  }
  // Use the fetch API to make a POST request
  await fetch(url, {
    method: 'POST', // Specify the method
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonBody),
  });
}