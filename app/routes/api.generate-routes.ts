// app/routes/api.generate-routes.ts

import fs from "node:fs";
import path from "node:path";

import { TABLES } from "~/db/schema/table-models";

const routeTemplate = (
  tableName: keyof typeof TABLES,
  routeName: string,
) => `// app/routes/${TABLES[tableName].urlName}+/_index.tsx

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ${tableName} } from "~/db/schema";
import { NewMain } from "~/components/new-main";

export async function loader(args: LoaderFunctionArgs) {
  const { db } = args.context;
  const tableObjects = await db.query.${tableName}.findMany({
    orderBy: ${tableName}.id,
  });

  console.log("Loader data:", tableObjects);

  return {
    tableObjects,
  };
}

export default function ${routeName}() {
  const { tableObjects } = useLoaderData<typeof loader>();

  console.log("Component data:", tableObjects);

  return <NewMain data={tableObjects} />;
}
`;

export async function loader() {
  const routesDir = path.join(process.cwd(), "app", "routes");
  const generatedRoutes = [];

  for (const [tableName, config] of Object.entries(TABLES)) {
    console.log(`Generating route for ${tableName}`);

    const routeFile = path.join(routesDir, `${config.urlName}+/_index.tsx`);

    fs.mkdirSync(path.dirname(routeFile), { recursive: true });
    fs.writeFileSync(routeFile, routeTemplate(tableName, config.displayName.replace(" ", "")));

    generatedRoutes.push({
      tableName,
      path: routeFile,
    });

    console.log(`Generated route file at: ${routeFile}`);
  }

  return { success: true, generatedRoutes };
}
