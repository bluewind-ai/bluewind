// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(dns_records: array) {
  const dkim = dns_records.find((obj) => obj.content.includes("v=DKIM1"));
  return {
    dkim
  }
}