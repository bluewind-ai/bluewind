// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(primary_domain_name: string) {
  return {
    secondary_domain_names: [
      `go${primary_domain_name}.com`,
      `get${primary_domain_name}.com`,
      `join${primary_domain_name}.com`,
      `try${primary_domain_name}.com`,
      `${primary_domain_name}hq.com`
    ]
  }
}
