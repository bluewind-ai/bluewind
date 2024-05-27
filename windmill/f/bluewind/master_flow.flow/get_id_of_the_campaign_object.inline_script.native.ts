export async function main(twenty_api_key: string) {
  const query = `
    query {
      objects {
        edges {
          node {
            id
            nameSingular
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
  const filteredObject = data.data.objects.edges.find(
    (edge: any) => edge.node.nameSingular === "campaign"
  );
  return {
    campaign_obect_metadata: filteredObject.node.id
  }
}