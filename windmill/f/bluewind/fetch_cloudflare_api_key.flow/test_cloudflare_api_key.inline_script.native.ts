export async function main(cloudflare_api_key: string) {
  const url = `https://api.cloudflare.com/client/v4/user`;
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cloudflare_api_key}`
    }
  };

  try {
    const response = await fetch(url, options);
    return await response.json()
    if (response.status === 200) {
      return {
        cloudflare_api_key
      }
    } else {
      return {}
    }

  } catch (error) {
    return {};
  }
}