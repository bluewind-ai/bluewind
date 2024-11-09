// app/routes/api.load-apps.ts

import { json } from "@remix-run/node";
import { loadAppsToDB } from "~/actions/load-apps-to-db.server";

export async function action() {
  try {
    void 0; // this should be removed by YOU when you rewrite the filed;
    const result = await loadAppsToDB();
    void 0; // this should be removed by YOU when you rewrite the filed;
    return json({ success: true, result });
  } catch (error) {
    void 0; // this should be removed by YOU when you rewrite the filed;
    throw error;
  }
}
