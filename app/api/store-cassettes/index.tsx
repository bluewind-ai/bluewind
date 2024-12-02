// app/api/store-cassettes/index.tsx
import { Hono } from "hono";
import { join } from "path";

import { writeFile } from "../../lib/intercepted-fs";

const getDurationRange = (ms: number): string => {
  return ms <= 1000 ? "< 1000" : "1001+";
};
const getBytesRange = (bytes: number): string => {
  const MB = 1024 * 1024;
  return bytes < MB ? "< 1 MB" : "1 MB+";
};
const processNode = (obj: any): any => {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(processNode);
  }
  const newObj: any = {};
  if (obj.id !== undefined) {
    newObj.id = "[MASKED]";
  }
  if (obj.pathname) {
    newObj.pathname = obj.pathname.includes("/get-request-tree/")
      ? obj.pathname.replace(/\/get-request-tree\/\d+/, "/get-request-tree/[MASKED]")
      : obj.pathname;
  }
  if (obj.createdLocation) {
    newObj.createdLocation = obj.createdLocation;
  }
  if (obj.response !== undefined) {
    newObj.response = processNode(obj.response);
  }
  if (obj.durationMs !== undefined) {
    newObj.durationMsRange = getDurationRange(obj.durationMs);
  }
  if (obj.requestSizeBytes !== undefined) {
    newObj.requestSizeBytesRange = getBytesRange(obj.requestSizeBytes);
  }
  if (obj.responseSizeBytes !== undefined) {
    newObj.responseSizeBytesRange = getBytesRange(obj.responseSizeBytes);
  }
  if (obj.children) {
    newObj.children = processNode(obj.children);
  }
  if (obj.objects) {
    newObj.objects = processNode(obj.objects);
  }
  for (const key in obj) {
    if (
      !newObj.hasOwnProperty(key) &&
      key !== "durationMs" &&
      key !== "requestSizeBytes" &&
      key !== "responseSizeBytes"
    ) {
      newObj[key] = processNode(obj[key]);
    }
  }
  return newObj;
};
const app = new Hono();
app.post("/api/store-cassette", async (c) => {
  const { cassette } = await c.req.json();
  const data = typeof cassette === "string" ? JSON.parse(cassette) : cassette;
  const processedCassette = processNode(data);
  const finalCassette = JSON.stringify(processedCassette, null, 2);
  await writeFile(join(process.cwd(), "cassette.json"), finalCassette, "utf-8");
  return c.json({ success: true });
});
export default app;
