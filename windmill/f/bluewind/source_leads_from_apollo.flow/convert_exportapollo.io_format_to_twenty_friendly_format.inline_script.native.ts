// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime
export async function main(data: Array, campaign_name: string) {
  const inputs = data.map(item => ({
    email_address: item.email,
    first_name: item.first_name,
    last_name: item.last_name,
    linkedin_link: item.linkedin_url,
    job_title: item.title,
    email_validity: "UNKNOWN",
    email_catch_all_status: "UNKNOWN"
  }));

  return inputs;
}