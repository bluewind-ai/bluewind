export async function main(importId: string, hubspot_access_token: string) {
  // Step 1: Retrieve contact IDs imported with the given import ID using the search endpoint
  let after = 0;
  let hasMore = true;
  const contactIds: string[] = [];

  while (hasMore) {
    const contactsResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspot_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_object_source_detail_1',
                operator: 'EQ',
                value: importId,
              },
            ],
          },
        ],
        properties: [],
        limit: 100,
        after: after,
      }),
    });

    const contactsData = await contactsResponse.json();

    if (contactsData.results && Array.isArray(contactsData.results)) {
      const batchContactIds = contactsData.results.map((contact: any) => contact.id);
      contactIds.push(...batchContactIds);
    }

    hasMore = contactsData.paging && contactsData.paging.next && contactsData.paging.next.after;
    after = hasMore ? contactsData.paging.next.after : 0;
  }

  return contactIds;
}