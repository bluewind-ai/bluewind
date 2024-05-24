export async function main(secrets: string) {
  const lines = secrets.split('\n');
  // Create an empty JSON object
  const json: Record<string, string> = {};

  // Iterate over each line
  for (const line of lines) {
    // Skip empty lines or lines starting with '#'
    if (line.trim() === '' || line.startsWith('#')) {
      continue;
    }

    // Check if the line contains a valid key-value pair
    if (line.includes('=')) {
      // Split the line into key-value pairs
      const [key, value] = line.split('=');

      // Assign the key-value pair to the JSON object
      json[key.trim()] = value.trim();
    }
  }

  return json;
}