export async function main(twenty_api_key: string, data: Array) {
  const url = 'https://api.twenty.com/rest/batch/people';
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  const response = await fetch(url, options);
  return await response.text()
}