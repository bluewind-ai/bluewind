export async function main(nocodb: Object, campaign_name: string) {
  const url = `${nocodb.apiUrl}/api/v2/tables/mmbbdm5ek99c71g/records`;

  const options = {
    method: 'POST',
    headers: {
      "xc-token": `${nocodb.xc_token}`,
      'Content-Type': 'application/json',
      'Accept': "application/json",
      body: JSON.stringify({
        name: campaign_name
      })
    },
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw "error"
    }
    const data = await response.json()
    return {
      Id: data,
      name: campaign_name,
      smartlead_campaign_id: null
    }
  } catch (error) {
    return error;
  }
}