import fetch from 'node-fetch';

interface ImportRequest {
  name: string;
  importOperations: {
    [key: string]: string;
  };
  dateFormat: string;
  files: {
    fileName: string;
    fileFormat: string;
    fileImportPage: {
      hasHeader: boolean;
      columnMappings: {
        columnObjectTypeId: string;
        columnName: string;
        propertyName: string;
        columnType?: string;
      }[];
    };
  }[];
  listMemberships: {
    listId: string | number;
  }[];
}

export async function main(hubspot_access_token: string, csvData: string, importName: string) {
  const importRequest: ImportRequest = {
    name: importName,
    importOperations: {
      '0-1': 'CREATE',
    },
    dateFormat: 'DAY_MONTH_YEAR',
    files: [
      {
        fileName: 'contacts.csv',
        fileFormat: 'CSV',
        fileImportPage: {
          hasHeader: true,
          columnMappings: [
            {
              columnObjectTypeId: '0-1',
              columnName: 'Email',
              propertyName: 'email',
              columnType: 'HUBSPOT_ALTERNATE_ID',
            },
            {
              columnObjectTypeId: '0-1',
              columnName: 'Job Title',
              propertyName: 'jobtitle',
            },
            {
              columnObjectTypeId: '0-1',
              columnName: 'Last Name',
              propertyName: 'lastname',
            },
            {
              columnObjectTypeId: '0-1',
              columnName: 'First Name',
              propertyName: 'firstname',
            },
            {
              columnObjectTypeId: '0-1',
              columnName: 'import_id',
              propertyName: 'import_id',
            },
            {
              columnObjectTypeId: '0-1',
              columnName: 'LinkedIn URL',
              propertyName: 'linkedin_url',
            },
          ],
        },
      },
    ],
  };

  const boundary = '--boundary_string';
  const formData = [
    `${boundary}`,
    'Content-Disposition: form-data; name="files"; filename="contacts.csv"',
    'Content-Type: text/csv',
    '',
    csvData,
    `${boundary}`,
    'Content-Disposition: form-data; name="importRequest"',
    'Content-Type: application/json',
    '',
    JSON.stringify(importRequest),
    `${boundary}--`,
  ].join('\r\n');

  const response = await fetch('https://api.hubapi.com/crm/v3/imports', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hubspot_access_token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary.slice(2)}`,
    },
    body: formData,
  });

  return await response.json();
}