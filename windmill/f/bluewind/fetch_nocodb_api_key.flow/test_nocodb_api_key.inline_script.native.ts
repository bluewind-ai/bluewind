export async function main(nocodb: Object) {
  const url = `https://app.nocodb.com/api/v1/db/meta/nocodb/info`;
  const options = {
    method: 'GET',
    headers: {
      "xc-auth": `Bearer ${nocodb.xc_token}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      return "ok"
      return {};
    }
    return nocodb;
  } catch (error) {
    return {};
  }
}