import * as wmill from "npm:windmill-client@^1.158.2";

export async function main(smartlead_campaign_id: string) {
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    default_args: {
      instructions:
        `go here https://app.smartlead.ai/app/email-campaign/${smartlead_campaign_id}/analytics, click on "edit", then "review". Now approve or reject these drafts.`,
    },
    resume: resumeUrls["resume"],
    cancel: resumeUrls["cancel"],
  };
}
