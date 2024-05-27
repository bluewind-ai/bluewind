// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(isEmailValid: boolean, isEmailCatchall: boolean) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  return {
    isEmailValid,
    isEmailCatchall
  }
}
