// app/api/load-routes/index.tsx

import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { serverFunctions } from "~/db/schema";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/api/load-routes", async (c) => {
  console.log("[setup] Loading routes...");
  const apiPath = join(process.cwd(), "app/api");
  console.log("[setup] API path:", apiPath);

  // Get all entries in the api directory
  const entries = await readdir(apiPath);
  console.log("[setup] Found directory entries:", entries);

  const routes: string[] = [];

  // Process each entry
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;

    const fullPath = join(apiPath, entry);
    console.log("[setup] Checking path:", fullPath);

    try {
      // Only try to read directories
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        const subEntries = await readdir(fullPath);
        if (subEntries.includes("index.tsx")) {
          const relativePath = relative(apiPath, fullPath);
          routes.push(relativePath);
        }
      }
    } catch (error) {
      // Log error but continue processing other entries
      console.log(`[setup] Error checking ${entry}:`, error);
    }
  }

  console.log("[setup] Final routes:", routes);

  // For each route, create a server function if it doesn't exist
  for (const route of routes) {
    // Check if server function already exists
    const existing = await db
      .select()
      .from(serverFunctions)
      .where(eq(serverFunctions.name, route))
      .limit(1);

    if (existing.length === 0) {
      // Create new server function
      await db.insert(serverFunctions).values({
        name: route,
        type: "API", // Use string literal instead of enum property
        requestId: c.requestId,
        metadata: {
          label: route.charAt(0).toUpperCase() + route.slice(1).replace(/-/g, " "),
          variant: "default",
        },
        createdLocation: getCurrentLocation(),
      });
    }
  }

  return c.json({
    success: true,
    routes,
  });
});

export default app;
