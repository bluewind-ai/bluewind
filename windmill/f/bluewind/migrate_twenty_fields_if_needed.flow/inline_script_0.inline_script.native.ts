export async function main() {
  try {
    const response = await fetch(`${BASE_INTERNAL_URL}/api/w/${WM_WORKSPACE}/flows/get/f/bluewind/migrate_twenty_fields_if_needed`, {
      headers: { Authorization: `Bearer ${WM_TOKEN}` }
    });
  } catch (error) {
    throw error;
  }
}