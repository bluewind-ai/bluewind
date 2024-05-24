// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(emails_to_clean: number) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  return {
    "array_iterator": Array(emails_to_clean).fill(0)
    }
}
