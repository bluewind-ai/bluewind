import * as wmill from "windmill-client"

export async function main() {
  const resumeUrls = await wmill.getResumeUrls("approver1")

  return {
    resume: resumeUrls['resume'],
    default_args: {
      "TWENTY_API_KEY": "YOUR_TWENTY_API_KEY"
    },
    enums: {}
  }
}
