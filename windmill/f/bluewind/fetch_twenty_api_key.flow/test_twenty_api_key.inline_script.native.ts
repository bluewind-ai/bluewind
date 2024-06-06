export async function main(twenty: Twenty) {
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
    return {
      twenty_api_key,
    };
  } catch (error) {
    return {};
  }
}
