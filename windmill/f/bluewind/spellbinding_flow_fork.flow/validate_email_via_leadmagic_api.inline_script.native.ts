export async function main(email: string, leadmagic_api_key: string) {
  const url = 'https://api.leadmagic.io/email-validate';

  const headers = {
    'X-API-Key': leadmagic_api_key,
    'accept': 'application/json',
    'content-type': 'application/json',
  };

  const data = {
    email: email,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      return result
      console.log(result);
    } else {
      console.error('Request failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
