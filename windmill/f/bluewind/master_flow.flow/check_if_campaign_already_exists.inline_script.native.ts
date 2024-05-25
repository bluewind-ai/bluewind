export async function main(twenty_api_key: string, campaign_name: string) {
  const encodedCampaignName = encodeURIComponent(campaign_name);
  const url = `https://api.twenty.com/rest/campaigns?filter=name%5Beq%5D%3A%22${encodedCampaignName}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`
    }
  });

  return await response.json();
}