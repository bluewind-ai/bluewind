export async function main(url: string) {
  const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = sheetIdMatch ? sheetIdMatch[1] : '';
  const sheetNameMatch = url.match(/gid=(\d+)/);
  const sheetName = sheetNameMatch ? `Sheet${sheetNameMatch[1]}` : 'Sheet1';

  const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`);
  const text = await response.text();
  const rows = text.split('\n');

  // Extract the header row
  const headers = rows[0].split(',').map(header => header.replace(/"/g, ''));

  // Process the data rows and convert them to objects
  const data = rows.slice(1).map(row => {
    const values = row.split(',').map(value => value.replace(/"/g, ''));
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
  });
  return data
}