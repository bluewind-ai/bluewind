export async function main(cloudflare_api_key: string) {
  const url = `https://api.cloudflare.com/client/v4/user`;
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Auth-Key': cloudflare_api_key
    }
  };
  try {
    const response = await fetch(url, options);
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