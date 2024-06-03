export async function main() {
  const now = new Date();
  const gmtTimestamp = now.toISOString();

  const data = {
    path: `u/${WM_USERNAME}/twenty_last_migrated_at_iso_8601`,
    value: {
      twenty_last_migrated_at_iso_8601: gmtTimestamp
    },
    description: '',
    resource_type: 'c_twenty_last_migrated_at_iso_8601',
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
    "ok": "ok"
  }

}
