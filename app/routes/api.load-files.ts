// app/routes/api.load-files.ts

import { json } from "@remix-run/node";
import { loadFiles } from "~/functions/load-files.server";

export async function loader() {
  try {
    const result = await loadFiles();
    return json(result);
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
