// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(email_validity: string, email_catch_all_status: string) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  return {
    email_validity: email_validity,
    email_catch_all_status: email_catch_all_status
  }
}
