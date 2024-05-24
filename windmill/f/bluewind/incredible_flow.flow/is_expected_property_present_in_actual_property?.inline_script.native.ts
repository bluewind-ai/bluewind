// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(expected_property: Object, actual_properties: Object) {
  return actual_properties.hasOwnProperty(expected_property.name);
}