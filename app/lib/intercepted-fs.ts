// app/lib/intercepted-fs.ts

import * as fs from "node:fs/promises";

const interceptors: Array<(path: string, data: string) => void> = [];

export const writeFile = async (path: string, data: string, encoding: BufferEncoding) => {
  console.log("[intercepted-fs] Writing to path:", path);
  console.log("[intercepted-fs] Data:", data);
  interceptors.forEach((i) => i(path, data));
  return fs.writeFile(path, data, encoding);
};

export const addInterceptor = (fn: (path: string, data: string) => void) => {
  interceptors.push(fn);
  console.log("[intercepted-fs] Added interceptor, total:", interceptors.length);
};
