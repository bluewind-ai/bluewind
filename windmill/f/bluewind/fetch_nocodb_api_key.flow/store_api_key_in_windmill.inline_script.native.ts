export async function main(all_attempts: Array) {
  const nocodb_resource = all_attempts[all_attempts.length - 1];
  const data = {
    path: `u/${WM_USERNAME}/nocodb`,
    value: nocodb_resource,
    description: '',
    resource_type: 'nocodb',
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

  return nocodb_resource
}
