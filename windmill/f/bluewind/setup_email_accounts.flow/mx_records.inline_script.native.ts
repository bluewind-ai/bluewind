export async function main(cloudflare_api_key: string, domain_name_just_created: string, domain_id: string) {
  const url = `https://api.cloudflare.com/client/v4/zones/${domain_id}/dns_records`;
  let options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    },
    body: JSON.stringify({
      "content": "alt1.aspmx.l.google.com",
      "name": domain_name_just_created,
      "type": "MX",
      "priority": 5
    })
  };
  await fetch(url, options);

  options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    },
    body: JSON.stringify({
      "content": "alt2.aspmx.l.google.com",
      "name": domain_name_just_created,
      "type": "MX",
      "priority": 5
    })
  };
  await fetch(url, options);

  options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    },
    body: JSON.stringify({
      "content": "alt3.aspmx.l.google.com",
      "name": domain_name_just_created,
      "type": "MX",
      "priority": 10
    })
  };
  await fetch(url, options);

  options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    },
    body: JSON.stringify({
      "content": "alt4.aspmx.l.google.com",
      "name": domain_name_just_created,
      "type": "MX",
      "priority": 10
    })
  };
  await fetch(url, options);

  options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    },
    body: JSON.stringify({
      "content": "aspmx.l.google.com",
      "name": domain_name_just_created,
      "type": "MX",
      "priority": 1

    })
  };
  const response = await fetch(url, options);
  const data = await response.json()
  return data
}
