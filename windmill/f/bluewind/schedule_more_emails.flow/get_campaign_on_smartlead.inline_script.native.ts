export async function main(smartlead_api_key: string, smartlead_campaign_id: string) {
  const url = `https://server.smartlead.ai/api/v1/campaigns/${smartlead_campaign_id}?api_key=${smartlead_api_key}`;
  const options = {
    method: 'GET'
  };
  const response = await fetch(url, options);
  return await response.json()
}