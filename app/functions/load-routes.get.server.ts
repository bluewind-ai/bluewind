// app/functions/load-routes.get.server.ts
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

import { eq } from "drizzle-orm";

import { serverFunctions } from "~/db/schema";
import { routes as routesTable } from "~/db/schema/routes/schema";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

import { appRoutes } from "../api/register-routes";

async function generateHashFromFile(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, "utf-8");
    const hash = createHash("sha256").update(content).digest("hex");
    return hash;
  } catch (error) {
    throw error;
  }
}
export async function loadRoutes(c: any) {
  const apiPath = join(process.cwd(), "app/api");
  // Get all entries in the api directory
  const entries = await readdir(apiPath);
  const routePaths: string[] = [];
  const routeHashes = new Map<string, string>();
  // Process each entry
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) {
      continue;
    }
    const fullPath = join(apiPath, entry);
    try {
      // Only try to read directories
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        const subEntries = await readdir(fullPath);
        if (subEntries.includes("index.tsx")) {
          const relativePath = relative(apiPath, fullPath);
          const indexPath = join(fullPath, "index.tsx");
          const hash = await generateHashFromFile(indexPath);
          routePaths.push(relativePath);
          routeHashes.set(relativePath, hash);
        }
      }
    } catch (error) {}
  }
  // For each route, create or update both server function and route
  for (const routePath of routePaths) {
    const newHash = routeHashes.get(routePath)!;
    // Check if server function exists
    const existingServerFunction = await db
      .select()
      .from(serverFunctions)
      .where(eq(serverFunctions.name, routePath))
      .limit(1);
    if (existingServerFunction.length === 0) {
      // Create new server function
      await db.insert(serverFunctions).values({
        name: routePath,
        type: "API",
        hash: newHash,
        requestId: c.requestId,
        metadata: {
          label: routePath.charAt(0).toUpperCase() + routePath.slice(1).replace(/-/g, " "),
          variant: "default",
        },
        createdLocation: getCurrentLocation(),
      });
    } else if (existingServerFunction[0].hash !== newHash) {
      // Update hash if it changed
      await db
        .update(serverFunctions)
        .set({
          hash: newHash,
          requestId: c.requestId,
          createdLocation: getCurrentLocation(),
        })
        .where(eq(serverFunctions.name, routePath));
    }
    // Check if route exists
    const existingRoute = await db
      .select()
      .from(routesTable)
      .where(eq(routesTable.name, routePath))
      .limit(1);
    if (existingRoute.length === 0) {
      // Create new route
      await db.insert(routesTable).values({
        name: routePath,
        type: "API",
        hash: newHash,
        requestId: c.requestId,
        metadata: {
          label: routePath.charAt(0).toUpperCase() + routePath.slice(1).replace(/-/g, " "),
          variant: "default",
        },
        createdLocation: getCurrentLocation(),
      });
    } else if (existingRoute[0].hash !== newHash) {
      // Update hash if it changed
      await db
        .update(routesTable)
        .set({
          hash: newHash,
          requestId: c.requestId,
          createdLocation: getCurrentLocation(),
        })
        .where(eq(routesTable.name, routePath));
    }
  }
  const result = {
    success: true,
    routes: routePaths,
    routesHash: Object.fromEntries(routeHashes),
    appRoutesMap: appRoutes,
  };
  return result;
}
