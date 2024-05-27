// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(campaign_name: number = 3) {
  return {
    campaign_name
  }
}
