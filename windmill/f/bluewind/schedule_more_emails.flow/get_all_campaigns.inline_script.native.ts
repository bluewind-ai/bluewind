export async function main(nocodb: Object) {
  const url = `${nocodb.apiUrl}/api/v2/tables/mmbbdm5ek99c71g/records?fields=Id,name,smartlead_campaign_id`;

  const options = {
    method: 'GET',
    headers: {
      "xc-token": `${nocodb.xc_token}`,
      'Content-Type': 'application/json',
      'Accept': "application/json"
    },
  };
  try {
    const response = await fetch(url, options);
    return await response.json()
  } catch (error) {
    return error;
  }
}