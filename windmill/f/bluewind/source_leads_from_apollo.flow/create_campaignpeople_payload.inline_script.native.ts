// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime
export async function main(data: Array, campaign_name: string) {
  return data.data.createPeople.map(item => ({
    personId: item.id,
    campaignId: "873a1e7e-987a-4f4f-8344-c3d7a8bc8a5d",
    campaignStatus: "SOURCED"
  }))
}
