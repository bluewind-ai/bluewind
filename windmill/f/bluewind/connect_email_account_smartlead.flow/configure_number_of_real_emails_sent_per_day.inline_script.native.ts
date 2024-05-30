export async function main(smartlead_api_key: string, inbox_id: number) {
  const url = `https://server.smartlead.ai/api/v1/email-accounts/${inbox_id}?api_key=${smartlead_api_key}`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "max_email_per_day": 1,
      "custom_tracking_url": "",
      "time_to_wait_in_mins": 11
    })
  };

  const response = await fetch(url, options);
  return await response.json()
}