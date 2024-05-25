export async function main(twenty_api_key: string, campaign_name: string) {
  if (!campaign_name) {
    throw new Error("Campaign name is required.");
  }

  const url = `https://api.twenty.com/rest/people?filter=campaignName[eq]:"${encodeURIComponent(campaign_name)}"&filter=campaignStatus[eq]:"SOURCED"`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`
    }
  });

  return await response.json();
}