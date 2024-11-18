// app/functions/get-models.server.ts
import { models } from "~/db/schema";
import type { RequestExtensions } from "~/middleware";

export async function getModels(request: RequestExtensions, url: string) {
  const requestId = url.split("request-id=")[1];
  let query = request.db.query.models.findMany({
    orderBy: models.id,
  });
  if (requestId) {
    query = request.db.query.models.findMany({
      // where: sql`${models.requestId} = ${parseInt(requestId, 10)}`,
      orderBy: models.id,
    });
  }
  const result = await query;
  return result;
}
