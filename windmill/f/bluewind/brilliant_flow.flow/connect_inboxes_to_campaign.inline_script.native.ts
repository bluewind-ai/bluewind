export async function main(campaign_id: number, smartlead_api_key: string, inbox_ids: Array) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  // Construct the URL with the API key as a query parameter
  const url = `https://server.smartlead.ai/api/v1/campaigns/${campaign_id}/email-accounts?api_key=${smartlead_api_key}`

  const jsonBody = {
    "email_account_ids": inbox_ids
  }
  // Use the fetch API to make a POST request
  await fetch(url, {
    method: 'POST', // Specify the method
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonBody),
  });
  return {
    "campaign_url": `https://app.smartlead.ai/app/email-campaign/${campaign_id}/analytics`
    campaign_id
  }
}