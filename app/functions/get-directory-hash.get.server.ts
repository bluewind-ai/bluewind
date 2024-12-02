// app/functions/get-directory-hash.get.server.ts
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
export async function getDirectoryHash(c: any) {
  try {
    await sleep(2000);
    const dirPath = resolve("app");
    const dirStat = await stat(dirPath);
    const mtime = dirStat.mtimeMs;
    const ctime = dirStat.ctimeMs;
    return {
      mtime: formatDate(mtime),
      ctime: formatDate(ctime),
      mtimeRaw: mtime,
      ctimeRaw: ctime,
      directory: "../bluewind-data/sec-submissions",
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}
