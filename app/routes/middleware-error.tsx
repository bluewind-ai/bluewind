// app/routes/middleware-error.tsx
import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ context }: LoaderFunctionArgs) {
  const error = context.error;
  throw error; // This will trigger Remix's error boundary!
}
export default function MiddlewareError() {
  return null; // We never actually render this component since we're throwing in the loader
}
