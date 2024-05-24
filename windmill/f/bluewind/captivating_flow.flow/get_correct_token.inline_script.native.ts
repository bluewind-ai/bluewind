// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(corrected_hubspot_access_token: string, initial_hubspot_access_token: string) {
  return {
    "hubspot_access_token": corrected_hubspot_access_token
  }
}
