// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(leadmagic_api_key: string = 3) {
  const url = 'https://api.leadmagic.io/credits';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': leadmagic_api_key,
      'accept': 'application/json'
    }
  });
  return response.ok ? {
    leadmagic_api_key
  } : null
}