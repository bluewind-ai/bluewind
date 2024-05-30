export async function main(smartlead_api_key: string, inbox_id: string) {
  const url = `https://server.smartlead.ai/api/v1/email-accounts/${inbox_id}/warmup?api_key=${smartlead_api_key}`;
  const options = {
    method: 'POST',
    body: JSON.stringify({
      "warmup_enabled": "true",
      "total_warmup_per_day": 50,
      "daily_rampup": 4,
      "reply_rate_percentage": 55
    })
  };
  const response = await fetch(url, options);
  return await response.json()
}