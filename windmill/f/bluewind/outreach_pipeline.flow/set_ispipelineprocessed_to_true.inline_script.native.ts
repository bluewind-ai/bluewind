export async function main(twenty_api_key: string, campaign_person_id: string) {

  const url = `https://api.twenty.com/rest/campaignsPeople/${campaign_person_id}`;
  const options = {
    method: 'PATCH',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      isPipelineProcessed: true
    })
  };
  const response = await fetch(url, options);
  return await response.json()
}