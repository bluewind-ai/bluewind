export async function main(cloudflare_api_key: string, domain_name_just_created: string, domain_id: string, primary_domain_name: string) {
  const url = `https://api.cloudflare.com/client/v4/zones/${domain_id}/pagerules`
  const cloudflare_forward_to = `https://${primary_domain_name}/$2`
  const cloudflare_forward_from = `*${domain_name_just_created}/*`
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "actions": [
        {
          "id": "forwarding_url",
          "value": {
            "url": cloudflare_forward_to,
            "status_code": 301
          }
        }
      ],
      "priority": 1,
      "status": "active",
      "targets": [
        {
          "constraint": {
            "operator": "matches",
            "value": cloudflare_forward_from
          },
          "target": "url"
        }
      ]
    })
  };
  const response = await fetch(url, options);
  const data = await response.json()
  return data
}