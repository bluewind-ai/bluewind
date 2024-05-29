export async function main(cloudflare_api_key: string) {
  const url = `https://api.cloudflare.com/client/v4/accounts`;
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cloudflare_api_key}`,
    }
  };
  const response = await fetch(url, options);
  return await response.json()
}