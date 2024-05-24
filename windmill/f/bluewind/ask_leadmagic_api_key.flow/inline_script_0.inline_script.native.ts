export async function main() {
  const response = await fetch(`${BASE_INTERNAL_URL}/api/w/${WM_WORKSPACE}/resources/get_value_interpolated/u/${WM_USERNAME}/leadmagic`, {
    headers: { Authorization: `Bearer ${WM_TOKEN}` }
  });
  let result = null
  try {
    result = await response.json()
  } catch {
  }
  return result;
}