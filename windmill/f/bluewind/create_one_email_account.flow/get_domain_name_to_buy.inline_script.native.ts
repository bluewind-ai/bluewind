// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(domain_name_to_buy: string, custom_domain_name_to_buy: string) {
  if (custom_domain_name_to_buy === "") {
    return {
      domain_name_to_buy
    }
  } else {
    return {
      domain_name_to_buy: custom_domain_name_to_buy
    }
  }

}
