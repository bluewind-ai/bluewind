// Since there are no specific resource types mentioned, we will not define any resource types here.
// This function simply returns the inputs it receives.

export async function main(recipient_first_name: string, recipient_company_name: string): Promise<any> {
  return {
    "subject_lines": [
      "quick question",
      `${recipient_first_name}, thoughts?`,
    ]
  }
}