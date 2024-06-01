export async function main(smartlead_api_key: string, email_just_created: string) {
  const url = `https://server.smartlead.ai/api/v1/email-accounts?api_key=${smartlead_api_key}&username=${email_just_created}`;
  const options = {
    method: 'GET'
  };
  const response = await fetch(url, options);
  const data = await response.json()
  if (data.length > 0) {
    return {
      email_just_created: email_just_created,
      inbox_id: data[0].id
    }
  } else {
    return {}
  }
}