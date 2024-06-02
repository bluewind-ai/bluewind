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

  try {
    const response = await fetch('https://api.twenty.com/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${twenty_api_key}`,
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const data = await response.json();

      throw new Error(`HTTP error! status: ${response.status} error: ${JSON.stringify(data.errors, null, 2)}`);
    }

    const data = await response.json();
    const filteredObject = data.data.objects.edges.find(
      (edge: any) => edge.node.nameSingular === "person"
    );

    return {
      person_obect_metadata: filteredObject.node.id
    };
  } catch (error) {
    throw error;
  }
}