// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(primary_domain_name: string) {
  return {
    primary_domain_name
  }
}
