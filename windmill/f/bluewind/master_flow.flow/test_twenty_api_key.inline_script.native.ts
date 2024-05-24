export async function main(twenty_api_key: string) {
  const url = 'https://api.twenty.com/rest/apiKeys';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${twenty_api_key}`
    }
  });

  if (!response.ok) {
    return {
      "error": `HTTP error! status: ${response.status}`
    }
  }

  return {
    "twenty_api_key": twenty_api_key
  }
}

