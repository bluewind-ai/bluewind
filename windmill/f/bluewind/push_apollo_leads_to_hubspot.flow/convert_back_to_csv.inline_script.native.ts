export async function main(data: Array): string {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((person) => Object.values(person).join(","));
  return `${headers}\n${rows.join("\n")}`;
}
