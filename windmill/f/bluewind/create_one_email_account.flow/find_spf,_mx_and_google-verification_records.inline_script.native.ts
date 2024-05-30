// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(dns_records: array) {
  const spf = dns_records.find((obj) => obj.content.includes("v=spf1"));
  // const google_verification = dns_records.find((obj) => obj.content.includes("google-site-verification"));
  const mx = dns_records.find((obj) => obj.content.includes("aspmx.l.google.com"));
  return {
    spf,
    // google_verification,
    mx
  }
}