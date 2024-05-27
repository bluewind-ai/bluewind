// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(campaign: Object) {
  return {
    smartlead_campaign_id: campaign.smartleadCampaignId
  }
}
