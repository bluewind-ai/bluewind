export async function main(all_attempts: Array<string>) {
  if (all_attempts.length === 0) {
    return "No attempts found.";
  }

  return all_attempts[all_attempts.length - 1];
}