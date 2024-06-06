export async function main(twenty: Twenty) {
  const query = `
query {
  objects(paging: { first: 1000 }, filter: { isCustom: { is: true }}) {
    edges {
      node {
        id
        nameSingular
        isCustom
      }
    }
  }
}`;

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
    return data.data.objects.edges;
  } catch (error) {
    throw error;
  }
}
