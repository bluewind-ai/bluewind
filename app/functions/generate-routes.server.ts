// app/functions/generate-routes.server.ts

import fs from "node:fs";
import path from "node:path";

import { TableModel, TABLES } from "~/db/schema/table-models";

const serverFunctionTemplate = (tableName: keyof typeof TABLES) => {
  const isRequestsTable = TABLES[tableName].modelName === TableModel.REQUESTS;

  return `// app/functions/get-${TABLES[tableName].urlName}.server.ts

import { sql } from "drizzle-orm";
import { ${tableName} } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function get${tableName[0].toUpperCase() + tableName.slice(1)}(request: RequestExtensions, url: string) {
  console.log("get${tableName} called with URL:", url);

  ${
    !isRequestsTable
      ? `const requestId = url.split("request-id=")[1];
  console.log("Parsed requestId:", requestId);`
      : ""
  }

  let query = request.db.query.${tableName}.findMany({
    orderBy: ${tableName}.id,
  });

  ${
    !isRequestsTable
      ? `if (requestId) {
    console.log("Filtering by requestId:", parseInt(requestId, 10));
    query = request.db.query.${tableName}.findMany({
      where: sql\`\${${tableName}.requestId} = \${parseInt(requestId, 10)}\`,
      orderBy: ${tableName}.id,
    });
  }`
      : ""
  }

  const result = await query;
  console.log("Query result:", result);
  return result;
}`;
};

const routeTemplate = (
  tableName: keyof typeof TABLES,
  routeName: string,
) => `// app/routes/${TABLES[tableName].urlName}+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewMain } from "~/components/new-main";
import { get${tableName[0].toUpperCase() + tableName.slice(1)} } from "~/functions/get-${TABLES[tableName].urlName}.server";

export async function loader(args: LoaderFunctionArgs) {
  return get${tableName[0].toUpperCase() + tableName.slice(1)}(args.context, args.request.url);
}

export default function ${routeName}() {
  const tableObjects = useLoaderData<typeof loader>();
  return <NewMain data={tableObjects} />;
}`;

export async function generateRoutes() {
  const routesDir = path.join(process.cwd(), "app", "routes");
  const functionsDir = path.join(process.cwd(), "app", "functions");
  const generatedFiles = [];

  for (const [tableName, config] of Object.entries(TABLES)) {
    // Generate server function file
    const functionFile = path.join(functionsDir, `get-${config.urlName}.server.ts`);
    fs.writeFileSync(functionFile, serverFunctionTemplate(tableName));
    generatedFiles.push({
      type: "function",
      tableName,
      path: functionFile,
    });

    // Generate route file
    const routeFile = path.join(routesDir, `${config.urlName}+/_index.tsx`);
    fs.mkdirSync(path.dirname(routeFile), { recursive: true });
    fs.writeFileSync(routeFile, routeTemplate(tableName, config.displayName.replace(" ", "")));
    generatedFiles.push({
      type: "route",
      tableName,
      path: routeFile,
    });
  }

  return generatedFiles;
}
