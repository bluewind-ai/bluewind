export async function main(cloudflare_api_key: string, domain_name_just_created: string, domain_id: string) {
  const url = `https://api.cloudflare.com/client/v4/zones/${domain_id}/dns_records`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    },
    body: JSON.stringify({
      "content": "v=spf1 include:_spf.google.com -all",
      "name": domain_name_just_created,
      "type": "TXT"
    })
  };
  const response = await fetch(url, options);
  const data = await response.json()
  return data
}
