export async function main(twenty: Object) {
  // return twenty
  const query = `
query {
  objects(paging: { first: 1000 }) {
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
    const response = await fetch(`${twenty.twenty_base_url}/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${twenty.twenty_api_key}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const data = await response.json();
      return data

      throw new Error(
        `HTTP error! status: ${response.status} error: ${JSON.stringify(data.errors, null, 2)}`
      );
    }

    const data = await response.json();
    const filteredObject = data.data.objects.edges.find(
      (edge: any) => edge.node.nameSingular === 'person'
    );

    return {
      person_object_metadata: filteredObject.node.id,
    };
  } catch (error) {
    throw error;
  }
}
