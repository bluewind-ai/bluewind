export async function main(cloudflare_api_key: string, domain_name_just_created: string, domain_id: string) {
  const url = `https://api.cloudflare.com/client/v4/zones/${domain_id}/dns_records`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    },
    body: JSON.stringify({
      "content": `192.0.2.1`,
      "name": domain_name_just_created,
      "type": "A",
    })
  };
  const response = await fetch(url, options);
  const data = await response.json()
  return data
}