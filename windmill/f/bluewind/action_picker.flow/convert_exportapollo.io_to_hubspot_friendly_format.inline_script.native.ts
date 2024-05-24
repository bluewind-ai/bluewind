// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime
export async function main(data: Array, list_id: number) {
  const inputs = data.map(item => ({
    email: item.email,
    firstname: item.first_name,
    lastname: item.last_name,
    linkedin_url: item.linkedin_url,
    jobtitle: item.title
  }));

  return inputs;
}