// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(smartlead_response: object) {
  return {
    smartlead_campaign_id: smartlead_response.campaign_id
  }
}
