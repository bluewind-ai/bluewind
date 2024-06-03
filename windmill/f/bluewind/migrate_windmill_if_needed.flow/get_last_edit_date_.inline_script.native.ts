export async function main() {
  const response = await fetch(`${BASE_INTERNAL_URL}/api/w/${WM_WORKSPACE}/flows/get/f/bluewind/migrate_twenty_fields_if_needed`, {
    headers: { Authorization: `Bearer ${WM_TOKEN}` }
  });
  const responseClone = response.clone();

  try {
    if (response.status === 200) {
      const data = await response.json()
      return {
        edited_at: data.edited_at
      }
    } else {
      return { error_message: `status code: ${response.status}` }
    }
  } catch (error) {
    return { error_message: await responseClone.text() };
  }
}