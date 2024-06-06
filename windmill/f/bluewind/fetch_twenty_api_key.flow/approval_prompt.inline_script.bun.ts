import * as wmill from "windmill-client"

export async function main() {
  const resumeUrls = await wmill.getResumeUrls("approver1")

  return {
    resume: resumeUrls['resume'],
    default_args: {
      twenty_api_key: "YOUR_TWENTY_API_KEY",
      twenty_base_url: "https://api.twenty.com"
    }, // optional
    enums: {} // optional
  }
}