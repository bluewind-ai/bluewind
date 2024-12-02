// app/api/load-routes/index.tsx

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { serverFunctions } from "~/db/schema";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

const app = new Hono();

async function generateHashFromFile(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, "utf-8");
    return createHash("sha256").update(content).digest("hex");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

app.post("/api/load-routes", async (c) => {
  console.log("[setup] Loading routes...");
  const apiPath = join(process.cwd(), "app/api");
  console.log("[setup] API path:", apiPath);

  // Get all entries in the api directory
  const entries = await readdir(apiPath);
  console.log("[setup] Found directory entries:", entries);

  const routes: string[] = [];
  const routeHashes = new Map<string, string>();

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
          const indexPath = join(fullPath, "index.tsx");
          const hash = await generateHashFromFile(indexPath);
          routes.push(relativePath);
          routeHashes.set(relativePath, hash);
        }
      }
    } catch (error) {
      // Log error but continue processing other entries
      console.log(`[setup] Error checking ${entry}:`, error);
    }
  }

  console.log("[setup] Final routes:", routes);

  // For each route, create or update server function
  for (const route of routes) {
    const newHash = routeHashes.get(route)!;

    // Check if server function exists
    const existing = await db
      .select()
      .from(serverFunctions)
      .where(eq(serverFunctions.name, route))
      .limit(1);

    if (existing.length === 0) {
      // Create new server function
      await db.insert(serverFunctions).values({
        name: route,
        type: "API",
        hash: newHash,
        requestId: c.requestId,
        metadata: {
          label: route.charAt(0).toUpperCase() + route.slice(1).replace(/-/g, " "),
          variant: "default",
        },
        createdLocation: getCurrentLocation(),
      });
    } else if (existing[0].hash !== newHash) {
      // Update hash if it changed
      await db
        .update(serverFunctions)
        .set({
          hash: newHash,
          requestId: c.requestId, // Update requestId to latest
          createdLocation: getCurrentLocation(), // Update location too
        })
        .where(eq(serverFunctions.name, route));
    }
  }

  return c.json({
    success: true,
    routes,
  });
});

export default app;
