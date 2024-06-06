export async function main(twenty: Twenty, campaign_name: string) {
  const url = `${twenty.twenty_base_url}/rest/campaigns`;
  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: campaign_name,
    }),
  };

  const response = await fetch(url, options);
  const data = await response.json();
  return data.data.createCampaign;
}
