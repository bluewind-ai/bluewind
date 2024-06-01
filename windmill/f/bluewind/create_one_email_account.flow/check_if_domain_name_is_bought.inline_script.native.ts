export async function main(
  cloudflare_api_key: string, domain_name_just_created: string, primary_domain_name: string) {
  const url = `https://api.cloudflare.com/client/v4/zones?name=${domain_name_just_created}`;
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    }
  };
  const response = await fetch(url, options);
  const data = await response.json()
  if (data.result !== undefined && data.result.length !== 0) {
    return {
      domain_name_just_created: domain_name_just_created,
      domain_id: data.result[0].id,
      primary_domain_name
    }
  } else {
    return {}
  }
}