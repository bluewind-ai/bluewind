export async function main(twenty: Twenty, campaign_person_id: string) {
  const url = `https://api.twenty.com/rest/campaignsPeople/${campaign_person_id}`;
  const options = {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      campaignStatus: 'EMAIL_SCHEDULED',
    }),
  };
  const response = await fetch(url, options);
  return await response.json();
}
