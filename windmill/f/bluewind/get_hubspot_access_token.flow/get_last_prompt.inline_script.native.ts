// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(access_token_inputs: Array) {
  const len = access_token_inputs.length
  return {
    valid_hubspot_access_token: access_token_inputs[len - 1].valid_hubspot_access_token
  }
}
