export async function main(twenty_api_key: string) {
  const query = `query FindManyPeople {
  people(first: 1000) {
    edges {
      node {
        id
      }
    }
  }
}`;

  let variables = {
  };

  let response = await fetch('https://api.twenty.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,

    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  const data = await response.json()
  return data.data.people.edges.map(obj => obj.node.id);
}