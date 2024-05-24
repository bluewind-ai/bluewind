// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(domain_name: string, superagent_api_key: string) {
  const API_URL =
    "https://api.beta.superagent.sh/api/v1/workflows/c6358868-cbb0-4225-98ef-5ad3d7dc91d4/invoke";
  const HEADERS = {
    authorization: `Bearer ${superagent_api_key}`,
    "content-type": "application/json",
  };

  const PAYLOAD = JSON.stringify({
    input: `Please give the link of a job application for an entry level software engineer remote, the linkedin url of the recruiter working in this company`,

    enableStreaming: false,
    // Remove outputSchema to return text.
    outputSchema: "{application_url: string, recruiter_linkedin_url: string}",
  });

  const responseData = await fetch(API_URL, {
    method: "POST",
    headers: HEADERS,
    body: PAYLOAD,
  });

  const { data: { output } } = await responseData.json();
  return output
}
