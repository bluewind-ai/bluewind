export async function main(data: Array, campaign_name: string, twenty_campaign_id: string) {
  return data.map(item => ({
    name: `${campaign_name} ${item.name.firstName} ${item.name.lastName}`,
    personId: item.id,
    campaignId: twenty_campaign_id,
    tags: [
      "PIPELINE_TODO"
    ],
    tagsFlattened: "PIPELINE_TODO"
  }))
}