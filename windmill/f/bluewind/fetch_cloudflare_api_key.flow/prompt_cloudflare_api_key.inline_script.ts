import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    resume: resumeUrls["resume"],
    default_args: {
      instructions:
        "Create the cloudflare api token: https://www.loom.com/share/b6210ab42c194118985455ce01abb2f",
      cloudflare_api_key: "YOUR_CLOUDFLARE_API_KEY",
    },
  };
}
