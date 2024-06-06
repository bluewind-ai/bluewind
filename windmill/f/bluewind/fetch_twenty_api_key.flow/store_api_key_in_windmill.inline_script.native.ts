export async function main(all_attempts: Array) {
  const correct_api_key = all_attempts[all_attempts.length - 1].twenty_api_key;
  const twenty_resource = {
    twenty_api_key: correct_api_key,
    twenty_base_url: "https://api.twenty.com"
  }
  const data = {
    path: `u/${WM_USERNAME}/twenty`,
    value: twenty_resource,
    description: '',
    resource_type: 'twenty',
  };

  const url = `${BASE_INTERNAL_URL}/api/w/${WM_WORKSPACE}/resources/create`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return twenty_resource
}
