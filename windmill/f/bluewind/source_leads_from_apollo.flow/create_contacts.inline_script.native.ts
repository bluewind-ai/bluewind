export async function main(nocodb: nocodb, data: Array) {
  const url = `${nocodb.apiUrl}/api/v2/tables/mm7sdtcwkmxyk43/records`;

  const options = {
    method: 'POST',
    headers: {
      "xc-token": `${nocodb.xc_token}`,
      'Content-Type': 'application/json',
      'Accept': "application/json",
    },
    body: JSON.stringify([
      {}
    ])
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw "error"
    }
    const data = await response.json()

  } catch (error) {
    return error;
  }
}