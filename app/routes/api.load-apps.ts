// app/routes/api.load-apps.ts

import { json } from "@remix-run/node";
import { loadAppsToDB } from "~/actions/loadAppsToDB.server";

export async function action() {
  try {
    console.log("\n=== 🎯 API Load Apps Endpoint Called ===");
    const result = await loadAppsToDB();
    console.log("=== ✅ API Load Apps Complete ===\n");
    return json({ success: true, result });
  } catch (error) {
    console.error("=== ❌ API Load Apps Failed ===\n", error);
    throw error;
  }
}