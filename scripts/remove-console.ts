// scripts/remove-console.ts

import fetch from "node-fetch";
import type { ActionResponse } from "../app/routes/admin.remove-console";

async function removeConsole() {
  const response = await fetch("http://localhost:5173/admin/remove-console", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json()) as ActionResponse;
  console.log(data.message);

  if (data.modifiedFilePaths.length > 0) {
    console.log("\nModified files:");
    data.modifiedFilePaths.forEach((file) => console.log(`- ${file}`));
  }
}

removeConsole();
