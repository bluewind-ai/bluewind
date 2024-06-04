export async function main(twenty_api_key: string) {
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

  const url = 'https://api.twenty.com/metadata';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${twenty_api_key}`
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      throw ("error")
    }
    const data = await response.json()
    // return data
    return data.data.objects.edges

  } catch (error) {
    throw error
  }
}