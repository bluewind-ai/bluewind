//this assumes the Form tab has a string field named "foo" and a checkbox named "bar"

import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(campaigns: Array) {
  const campaign_names = campaigns.map((obj) => obj.name);

  // if no argument is passed, if user is logged in, it will use the user's username
  const resumeUrls = await wmill.getResumeUrls("approver1");

  // send the resumeUrls to the recipient or see Prompt section above

  return {
    enums: {
      campaign_to_pick: campaign_names,
    },
  };
}
