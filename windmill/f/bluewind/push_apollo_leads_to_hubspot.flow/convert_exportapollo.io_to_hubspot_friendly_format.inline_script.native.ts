// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime
export async function main(data: Array, date_now: string) {
  const inputs = data.map(item => ({
    email: item.email,
    firstname: item.first_name,
    lastname: item.last_name,
    linkedin_url: item.linkedin_url,
    jobtitle: item.title,
    import_id: date_now
  }));

  return inputs;
}