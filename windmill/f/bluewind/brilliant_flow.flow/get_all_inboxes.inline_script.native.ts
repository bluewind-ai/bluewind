export async function main(smartlead_api_key: string) {
  const response = await fetch(`https://server.smartlead.ai/api/v1/email-accounts/?api_key=${smartlead_api_key}&offset=0&limit=100`, {
    method: 'GET', // Specify the method
  });

  const data = await response.json();
  return data.map(obj => obj.id);
}