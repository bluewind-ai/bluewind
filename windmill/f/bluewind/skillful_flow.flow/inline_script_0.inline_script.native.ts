


export async function main(first_name: string, last_name: string, domain_name: string, leadmagic_api_key: string) {
  const response = await fetch('https://api.leadmagic.io/email-finder', {
    method: 'POST',
    headers: {
      'X-API-Key': leadmagic_api_key,
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      "first_name": first_name,
      "last_name": last_name,
      "domain": domain_name
    })
  });
  return await response.json();
}