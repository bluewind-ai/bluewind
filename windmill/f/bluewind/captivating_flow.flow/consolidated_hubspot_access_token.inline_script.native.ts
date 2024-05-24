// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(original_hubspot_access_token: string, corrected_hubspot_access_token: string) {

  return {
    "hubspot_access_token": corrected_hubspot_access_token || original_hubspot_access_token
  }
}