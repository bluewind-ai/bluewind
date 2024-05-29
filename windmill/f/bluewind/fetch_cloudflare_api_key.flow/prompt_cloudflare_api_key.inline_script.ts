import * as wmill from "npm:windmill-client@^1.158.2";

export async function main() {
  const resumeUrls = await wmill.getResumeUrls("approver1");

  return {
    resume: resumeUrls["resume"],
    default_args: {
      cloudflare_api_key: "YOUR_CLOUDFLARE_API_KEY",
    },
  };
}
