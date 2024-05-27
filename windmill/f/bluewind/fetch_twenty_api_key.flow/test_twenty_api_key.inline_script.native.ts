export async function main(twenty_api_key: string) {
  const url = 'https://api.twenty.com/rest/apiKeys';
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
      'Content-Type': 'application/json'
    }
  };
  try {
    await fetch(url, options);
    return {
      twenty_api_key
    }
  } catch (error) {
    return {};
  }
}