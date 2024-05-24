export async function main(linkedin_company_url: string, leadmagic_api_key: string) {
  const response = await fetch('https://api.leadmagic.io/company-search', {
    method: 'POST',
    headers: {
      'X-API-Key': leadmagic_api_key,
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      "profile_url": linkedin_company_url

    })
  });
  return await response.json();
}