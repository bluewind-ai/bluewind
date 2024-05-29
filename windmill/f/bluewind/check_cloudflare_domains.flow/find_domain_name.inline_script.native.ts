export async function main(cloudflare_api_key: string, domain_name_just_created: string) {
  const url = `https://api.cloudflare.com/client/v4/zones?name=${domain_name_just_created}`;
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    }
  };
  const response = await fetch(url, options);
  return await response.json()
}