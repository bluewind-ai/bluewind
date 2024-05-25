// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(twenty_api_key: string) {
  const mutation = `
    mutation CreateOneFieldMetadataItem($input: CreateOneFieldMetadataInput!) {
      createOneField(input: $input) {
        id
        type
      }
    }
  `;

  let variables = {
    input: {
      field: {
        description: null,
        icon: "IconUsers",
        label: "Is Email Valid",
        name: "isEmailValid",
        objectMetadataId: "e92cc3f7-959f-4389-9348-b41a9a8b07ef",
        type: "boolean"
      }
    }
  };


  let response = await fetch('https://api.twenty.com/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables
    })
  });


  variables = {
    input: {
      field: {
        description: null,
        icon: "IconUsers",
        label: "Is Email Catch All",
        name: "isEmailCatchAll",
        objectMetadataId: "e92cc3f7-959f-4389-9348-b41a9a8b07ef",
        type: "BOOLEAN"
      }
    }
  };


  response = await fetch('https://api.twenty.com/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables
    })
  });

  variables = {
    input: {
      field: {
        description: null,
        icon: "IconUsers",
        label: "Campaign Name",
        name: "campaignName",
        objectMetadataId: "e92cc3f7-959f-4389-9348-b41a9a8b07ef",
        type: "BOOLEAN"
      }
    }
  };


  response = await fetch('https://api.twenty.com/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables
    })
  });


  variables = {
    input: {
      field: {
        "description": "Status of this contact in the curent campaign",
        "icon": "IconUsers",
        "label": "Campaign Status",
        "name": "campaignStatus",
        "options": [
          {
            "color": "blue",
            "id": "5817df78-228d-4d17-a7eb-7875d380034d",
            "label": "Sourced",
            "position": 0,
            "value": "SOURCED"
          },
          {
            "color": "turquoise",
            "id": "cd2d4f3f-1404-483a-acf7-935b06fea8d8",
            "label": "Unqualified",
            "position": 1,
            "value": "UNQUALIFIED"
          },
          {
            "color": "green",
            "id": "ccf00459-c395-4c7f-aaa0-44cf960805e9",
            "label": "Email Scheduled",
            "position": 2,
            "value": "EMAIL_SCHEDULED"
          }
        ],
        "objectMetadataId": "e92cc3f7-959f-4389-9348-b41a9a8b07ef",
        "type": "SELECT"
      }
    }
  };


  response = await fetch('https://api.twenty.com/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${twenty_api_key}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: variables
    })
  });

  return await response.json();
}
