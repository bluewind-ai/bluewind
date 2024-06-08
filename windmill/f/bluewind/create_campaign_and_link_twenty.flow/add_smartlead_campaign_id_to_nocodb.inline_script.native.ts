export async function main(nocodb: Object, smartlead_campaign_id: string, campaign_id: number) {
  const url = `${nocodb.apiUrl}/api/v2/tables/mmbbdm5ek99c71g/records`;

  const options = {
    method: 'PATCH',
    headers: {
      "xc-token": `${nocodb.xc_token}`,
      'Content-Type': 'application/json',
      'Accept': "application/json",
    },
    body: JSON.stringify({
      Id: smartlead_campaign_id
    })
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json()
    return data
  } catch (error) {
    return error;
  }
}