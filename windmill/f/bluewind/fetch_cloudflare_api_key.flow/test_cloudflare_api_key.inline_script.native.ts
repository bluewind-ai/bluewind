export async function main(smartlead_api_key: string) {
  const url = `https://api.cloudflare.com/client/v4/user`;
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  try {
    const response = await fetch(url, options);
    if (response.status === 200) {
      return {
        smartlead_api_key
      }
    } else {
      return {}
    }

  } catch (error) {
    return {};
  }
}