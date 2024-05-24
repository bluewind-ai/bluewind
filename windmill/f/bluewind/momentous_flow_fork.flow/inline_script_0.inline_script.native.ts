// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(subject_line: number, body: string, email: string, linkedin_url: string) {
  return {
    "subject_line": subject_line,
    "body": body,
    "email": email,
    "linkedin_url": linkedin_url,
  }
}