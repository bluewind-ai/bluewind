// app/lib/middleware.ts

import { type LoaderFunctionArgs } from "@remix-run/node";

export async function beforeLoader(_args: LoaderFunctionArgs) {
  console.log("Before loader middleware");
  // Add your before loader logic here
  return;
}

export async function beforeAction(_args: LoaderFunctionArgs) {
  console.log("Before loader middleware");
  // Add your before loader logic here
  return;
}
