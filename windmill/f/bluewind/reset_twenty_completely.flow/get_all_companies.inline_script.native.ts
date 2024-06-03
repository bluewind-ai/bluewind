export async function main(twenty_api_key: string) {
  const query = `query FindManyCompanies {
  companies(first: 1000 ) {
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
  return data
  if (data.data !== undefined) {
    return data.data.companies.edges.map(obj => obj.node.id);
  }
  return []
}