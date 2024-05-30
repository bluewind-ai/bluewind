export async function main(cloudflare_api_key: string, domain_name_just_created: string, domain_id: string) {
  const url = `https://api.cloudflare.com/client/v4/zones/${domain_id}/dns_records`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    },
    body: JSON.stringify({
      "content": `v=DMARC1; p=reject; rua=mailto:postmaster@${domain_name_just_created}, mailto:dmarc@${domain_name_just_created}; pct=100; adkim=s; aspf=s`,
      "name": `_dmarc.${domain_name_just_created}`,
      "type": "TXT"
    })
  };
  const response = await fetch(url, options);
  const data = await response.json()
  return data
}
