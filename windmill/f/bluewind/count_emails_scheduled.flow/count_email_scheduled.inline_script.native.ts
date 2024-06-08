export async function main(nocodb: Object) {
  const url = `${nocodb.apiUrl}/api/v2/tables/m59o2tuojdl19od/records?where=${encodeURIComponent("(status,eq,SCHEDULED)")}&fields=Id`;

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