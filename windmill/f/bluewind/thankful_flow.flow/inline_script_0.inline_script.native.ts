export async function main(
  sender_company_name: string,
  domain_name: string,
  sender_first_name: string,
  sender_last_name: string,
  custom_taglines: string[],
): Promise<any> {
  const companies = [sender_company_name, domain_name];
  const separators = ['----------\n', ''];

  const signatures = custom_taglines.flatMap((tagline) => {
    return companies.flatMap((company) => {
      return separators.map((separator) => {
        return `${separator}${sender_first_name} ${sender_last_name}\n${tagline} @ ${company}\n`;
      });
    });
  });

  const randomIndex = Math.floor(Math.random() * signatures.length);
  const pickedSignature = signatures[randomIndex];

  return {
    signatures: signatures,
    picked_signature: pickedSignature,
  };
}