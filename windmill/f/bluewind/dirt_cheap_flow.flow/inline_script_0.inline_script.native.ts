// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime
export async function main(
  email: string,
  subject_line: string,
  body: string,
  linkedin_profile: string,
  smartlead_campaign_id: string,
  smartlead_api_key: string,
) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI

  // Define the API endpoint URL
  const apiUrl = `https://server.smartlead.ai/api/v1/campaigns/${smartlead_campaign_id}/leads?api_key=${smartlead_api_key}`;

  // Define the request payload
  const requestData = {
    lead_list: [
      {
        email: email,

        custom_fields: {
          message_1_subject: subject_line,
          message_1_body: body,
        },
        linkedin_profile: linkedin_profile,
      },
    ],
    settings: {
      ignore_global_block_list: false,
      ignore_unsubscribe_list: false,
      ignore_duplicate_leads_in_other_campaign: false,
    },
  };

  // Make the API request using fetch
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });
  return await response.json();

}


