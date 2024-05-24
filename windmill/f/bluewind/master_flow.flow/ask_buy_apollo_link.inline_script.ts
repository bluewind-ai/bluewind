//this assumes the Form tab has a string field named "foo" and a checkbox named "bar"

import * as wmill from 'npm:windmill-client@^1.158.2';

export async function main(apollo_link) {
  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls('approver1');

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    default_args: {
      instructions:
        'This looks correct. Please go to exportapollo.io and pay for these leads. Then put these leads in a google spreadsheet read only and paste the link below',
      apollo_leads_link: apollo_link,
      google_sheet_link: 'YOUR_GOOGLE_SHEET_LINK',
    },
    resume: resumeUrls['resume'],
  };
}
