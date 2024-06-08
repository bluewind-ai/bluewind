export async function main(nocodb: Object) {

  const url = `${nocodb.apiUrl}/api/v2/tables/{tableId}/records`;
  const options = {
    method: 'GET',
    headers: {
      "xc-auth": `Bearer ${nocodb.xc_token}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    const response = await fetch(url, options);
    return await response.json()
    if (!response.ok) {
      return "ok"
      return {};
    }
    return {
      xc_token: nocodb.xc_token,
      apiUrl: nocodb.apiUrl
    };
  } catch (error) {
    return {};
  }
}