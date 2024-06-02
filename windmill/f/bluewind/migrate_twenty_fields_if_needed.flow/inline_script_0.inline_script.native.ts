export async function main() {
  try {
    const response = await fetch(`${BASE_INTERNAL_URL}/api/w/${WM_WORKSPACE}/flows/get/f/bluewind/migrate_twenty_fields_if_needed`, {
      headers: { Authorization: `Bearer ${WM_TOKEN}` }
    });
    if (!response.ok) {
      const data = await response.json();

      throw new Error(`HTTP error! status: ${response.status} error: ${JSON.stringify(data.errors, null, 2)}`);
    }
    const data = await response.json()
    return await response.json()
  } catch (error) {
    throw error;
  }
}