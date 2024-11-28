// app/lib/intercepted-fs.ts

import * as fs from "node:fs/promises";

const writeInterceptors: Array<(path: string, data: string) => void> = [];
const readInterceptors: Array<(path: string, data: string) => void> = [];
const readdirInterceptors: Array<(path: string) => void> = [];

export const writeFile = async (path: string, data: string, encoding: BufferEncoding) => {
  console.log("[intercepted-fs] Writing to path:", path);
  console.log("[intercepted-fs] Data:", data);
  writeInterceptors.forEach((i) => i(path, data));
  return fs.writeFile(path, data, encoding);
};

export const readFile = async (path: string, encoding: BufferEncoding) => {
  console.log("[intercepted-fs] Reading from path:", path);
  const data = await fs.readFile(path, encoding);
  readInterceptors.forEach((i) => i(path, data));
  return data;
};

export const readdir = async (dir: string, options?: fs.readdirOptions) => {
  console.log("[intercepted-fs] Reading directory:", dir);
  readdirInterceptors.forEach((i) => i(dir));
  return fs.readdir(dir, options);
};

export const addWriteInterceptor = (fn: (path: string, data: string) => void) => {
  writeInterceptors.push(fn);
  console.log("[intercepted-fs] Added write interceptor, total:", writeInterceptors.length);
};

export const addReadInterceptor = (fn: (path: string, data: string) => void) => {
  readInterceptors.push(fn);
  console.log("[intercepted-fs] Added read interceptor, total:", readInterceptors.length);
};

export const addReaddirInterceptor = (fn: (path: string) => void) => {
  readdirInterceptors.push(fn);
  console.log("[intercepted-fs] Added readdir interceptor, total:", readdirInterceptors.length);
};
