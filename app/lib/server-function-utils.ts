// app/lib/server-function-utils.ts
import { functions } from "./server-functions";

export const handlersByPath = Object.fromEntries(
  Object.entries(functions).map(([name, fn]) => [
    `/api/${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    fn,
  ]),
);
