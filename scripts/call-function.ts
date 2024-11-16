// scripts/call-function.ts

import fetch from "node-fetch";
import process from "process";
import { fileURLToPath } from "url";

const API_URL = "http://localhost:5173/function-calls";

async function callFunction(functionName: string) {
  try {
    console.log(`Calling function: ${functionName}`);

    const formData = new URLSearchParams();
    formData.append("function", functionName);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const text = await response.text();

    if (text.includes("Error")) {
      console.error("\x1b[31m%s\x1b[0m", "Error detected in response"); // Red text
      console.error(text);
      process.exit(1);
    }

    console.log("\x1b[32m%s\x1b[0m", "Function called successfully"); // Green text
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "Error calling function:", error);
    process.exit(1);
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const functionName = process.argv[2];

  if (!functionName) {
    console.log("Available functions:");
    console.log("- truncateDb");
    console.log("- bootstrap");
    console.log("\nUsage: npm run call-function <functionName>");
    process.exit(1);
  }

  callFunction(functionName);
}
