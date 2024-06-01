export async function main(twenty_api_key: string, field_name: string) {
  const query = `
    query {
      fields(filter: { isCustom: { is: true } }) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  const url = 'https://api.twenty.com/metadata';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`
    },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  // return data
  const found_field = data.data.fields.edges.find(
    (edge: any) => edge.node.name === field_name
  );
  return {
    found_field
  }
}