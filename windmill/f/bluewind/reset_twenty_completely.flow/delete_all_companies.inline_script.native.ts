export async function main(twenty: Object, company_ids_to_delete: Array) {
  const query = `mutation DeleteManyCompanies($filter: CompanyFilterInput!) {
  deleteCompanies(filter: $filter) {
    id
    __typename
  }
}`;

  let variables = {
    filter: {
      id: {
        in: company_ids_to_delete,
      },
    },
  };

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
  return await response.json();
}
