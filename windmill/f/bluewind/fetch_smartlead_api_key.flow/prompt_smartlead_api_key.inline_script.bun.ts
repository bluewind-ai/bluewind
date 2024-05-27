import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    resume: resumeUrls["resume"],
    default_args: {
      smartlead_api_key:
        "YOUR_SMARTLEAD_API_KEY",
    },
  };
}
