export async function main(smartlead_api_key: string) {
  const url = 'https://server.smartlead.ai/api/v1/email-accounts?api_key=ea5efb9a-f162-464f-aa0b-88e8820d81ac_zrtdya5&limit=1';
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${smartlead_api_key}`,
      'Content-Type': 'application/json'
    }
  };
  try {
    await fetch(url, options);
    return {
      smartlead_api_key
    }
  } catch (error) {
    return {};
  }
}