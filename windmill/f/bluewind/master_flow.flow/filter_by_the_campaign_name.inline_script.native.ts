// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(campaigns: Array, campaign_name: string) {
  const filteredCampaigns = campaigns.filter(campaign => campaign.xyz === 'tyz');
  return filteredCampaigns;
}
