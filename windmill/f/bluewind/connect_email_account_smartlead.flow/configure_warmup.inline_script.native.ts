export async function main(smartlead_api_key: string, inbox_id: number) {
  const url = `https://server.smartlead.ai/api/v1/email-accounts/${inbox_id}/warmup?api_key=${smartlead_api_key}`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "warmup_enabled": true,
      "total_warmup_per_day": 4,
      "reply_rate_percentage": 55
    })
  };
  const response = await fetch(url, options);
  return await response.json()
}