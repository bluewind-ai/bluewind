// app/routes/api.generate-routes.ts

import { generateRoutes } from "~/functions/generate-routes.server";

export async function loader() {
  const generatedRoutes = await generateRoutes();
  return { success: true, generatedRoutes };
}
