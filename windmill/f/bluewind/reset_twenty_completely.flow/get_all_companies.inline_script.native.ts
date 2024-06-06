export async function main(twenty: Twenty) {
  const query = `query FindManyCompanies {
  companies(first: 1000 ) {
    edges {
      node {
        id
      }
    }
  }
}`;

  let variables = {};

  let response = await fetch(`${twenty.twenty_base_url}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${twenty.twenty_api_key}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  const data = await response.json();
  if (data.data !== undefined) {
    return data.data.companies.edges.map((obj) => obj.node.id);
  }
  return [];
}
