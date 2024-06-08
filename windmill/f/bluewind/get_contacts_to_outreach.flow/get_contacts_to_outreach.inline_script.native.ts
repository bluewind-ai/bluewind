export async function main(nocodb: Object) {
  const nestedFields = "nested[campaigns][fields]"
  const url = `${nocodb.apiUrl}/api/v2/tables/m59o2tuojdl19od/records?where=` +
    `${encodeURIComponent("(status,eq,TODO)")}` +
    `&${encodeURIComponent("nested[campaigns][fields]")}=name` +
    `&${encodeURIComponent("nested[contacts][fields]")}=first_name,last_name,email_address`;

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