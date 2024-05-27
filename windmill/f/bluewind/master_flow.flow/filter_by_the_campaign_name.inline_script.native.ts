// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime
export async function main(campaigns: Array, campaign_name: string) {
  const filteredCampaign = campaigns.find(campaign => campaign.name === campaign_name);
  return filteredCampaign || null;
}