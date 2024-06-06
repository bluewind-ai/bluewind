export async function main(all_attempts: Array) {
  const twenty = all_attempts[all_attempts.length - 1];
  const twenty_resource = {
    twenty_api_key: twenty.twenty_api_key,
    twenty_base_url: twenty.twenty_base_url
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
