export async function main(all_attempts: Array) {
  const correct_api_key = all_attempts[all_attempts.length - 1].twenty_api_key;
  const data = {
    path: `u/${WM_USERNAME}/twenty`,
    value: correct_api_key,
    description: '',
    resource_type: 'twenty',
  };

  const url = `${BASE_INTERNAL_URL}/api/w/${WM_WORKSPACE}/resources/create`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return await response.text()

  return {
    twenty_api_key: correct_api_key
  }

}
