export async function main(smartlead_api_key: string) {
  const url = `https://server.smartlead.ai/api/v1/email-accounts?api_key=${smartlead_api_key}&limit=1`;
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