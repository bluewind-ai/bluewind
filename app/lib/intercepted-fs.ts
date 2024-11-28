// app/lib/intercepted-fs.ts
import * as fs from "node:fs/promises";

const writeInterceptors: Array<(path: string, data: string) => void> = [];
const readInterceptors: Array<(path: string, data: string) => void> = [];
const readdirInterceptors: Array<(path: string) => void> = [];
export const writeFile = async (path: string, data: string, encoding: BufferEncoding) => {
  writeInterceptors.forEach((i) => i(path, data));
  return fs.writeFile(path, data, encoding);
};
export const readFile = async (path: string, encoding: BufferEncoding) => {
  const data = await fs.readFile(path, encoding);
  readInterceptors.forEach((i) => i(path, data));
  return data;
};
export const readdir = async (dir: string, options?: fs.readdirOptions) => {
  readdirInterceptors.forEach((i) => i(dir));
  return fs.readdir(dir, options);
};
export const addWriteInterceptor = (fn: (path: string, data: string) => void) => {
  writeInterceptors.push(fn);
};
export const addReadInterceptor = (fn: (path: string, data: string) => void) => {
  readInterceptors.push(fn);
};
export const addReaddirInterceptor = (fn: (path: string) => void) => {
  readdirInterceptors.push(fn);
};
