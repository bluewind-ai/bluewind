export async function main(twenty: Object) {
  const url = `${twenty.twenty_base_url}/rest/apiKeys`;
  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    await fetch(url, options);
    // const data = await response.json()
    return {
      twenty_api_key: twenty.twenty_api_key,
      twenty_base_url: twenty.twenty_base_url
    };
  } catch (error) {
    return {};
  }
}
