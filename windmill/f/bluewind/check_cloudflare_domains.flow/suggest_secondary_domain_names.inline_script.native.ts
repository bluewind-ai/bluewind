// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(primary_domain_name: string) {
  const primaryDomainWithoutTLD = primary_domain_name.split('.')[0];

  return {
    suggested_secondary_domain_names: [
      `go${primaryDomainWithoutTLD}.com`,
      `get${primaryDomainWithoutTLD}.com`,
      `join${primaryDomainWithoutTLD}.com`,
      `try${primaryDomainWithoutTLD}.com`,
      `${primaryDomainWithoutTLD}hq.com`
    ],
    or_write_your_own: "your_domain_name.com"
  }
}