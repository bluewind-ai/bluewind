// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime
export async function main(data: Array, campaign_name: string) {
  const inputs = data.map(item => ({
    email: item.email,
    name: {
      firstName: item.first_name,
      lastName: item.last_name
    },
    linkedinLink: {
      "label": "LinkedIn",
      "url": item.linkedin_url
    },
    jobTitle: item.title,
    campaignName: campaign_name,
    campaignStatus: "SOURCED"
  }));

  return inputs;
}