// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(data: Array) {
  return data.slice(0, Math.min(data.length, 20));

}
