export async function main(twenty_api_key: string, campaign_name: string) {
  name%5Beq%5D%3A%22${encodedCampaignName}
  const url = 'https://api.twenty.com/rest/campaigns';
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: campaign_name
    })
  };

  const response = await fetch(url, options);
  return await response.json()
}