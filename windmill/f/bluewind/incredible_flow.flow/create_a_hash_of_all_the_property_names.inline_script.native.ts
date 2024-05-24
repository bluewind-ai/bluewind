// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(data: array) {
  return data.map((property: any) => property.name);
}
