export async function main(twenty: Twenty) {
  const query = `
                  query {
                    fields(filter: { isCustom: { is: true }}) {
                      edges {
                        node {
                          id
                          name
                          type
                          relationDefinition {
                            relationId
                          }
                        }
                      }
                    }
                  }
                `;

  const url = `${twenty.twenty_base_url}/metadata`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${twenty.twenty_api_key}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw 'error';
    }
    const data = await response.json();
    // return data
    return data.data.fields.edges;
  } catch (error) {
    throw error;
  }
}
