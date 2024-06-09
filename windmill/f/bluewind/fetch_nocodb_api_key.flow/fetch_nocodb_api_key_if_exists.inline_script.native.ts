export async function main() {
  const response = await fetch(`${BASE_INTERNAL_URL}/api/w/${WM_WORKSPACE}/resources/get_value_interpolated/u/${WM_USERNAME}/nocodb`, {
    headers: { Authorization: `Bearer ${WM_TOKEN}` }
  });

  const responseClone = response.clone();


  try {

    if (response.status === 200) {
      return await response.json()
    } else {
      return { error_message: `status code: ${response.status}` }
    }
  } catch (error) {
    return { error_message: await responseClone.text() };
  }
}