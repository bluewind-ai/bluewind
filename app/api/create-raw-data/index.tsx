// app/api/create-raw-data/index.tsx

import { Hono } from "hono";

import { rawData } from "~/db/schema";
import { fetchWithContext } from "~/lib/fetch-with-context";

const app = new Hono();

app.post("/api/create-raw-data", async (c) => {
  try {
    const files = (await fetchWithContext(c)("http://localhost:5173/api/list-source-files", {
      method: "POST",
      headers: {
        "X-Parent-Request-Id": String(c.requestId),
      },
    }).then((r) => r.json())) as { files: string[] };

    console.log("[create-raw-data] Files from list-source-files:", files);

    const mappedValues = files.files.map((file) => ({
      json_content: { filePath: file },
      requestId: c.requestId,
    }));

    console.log("[create-raw-data] Mapped values:", mappedValues);

    const result = await c.db.insert(rawData).values(mappedValues).returning();

    return c.json({
      success: true,
      inserted: result.length,
      files: result,
    });
  } catch (error) {
    console.error("[create-raw-data] Error:", error);
    return c.json(
      {
        error: "Failed to create raw data",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

export default app;
