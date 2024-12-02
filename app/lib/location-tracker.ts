// app/lib/location-tracker.ts
/**
 * Returns the current file location and line number from the call stack
 * Converts '/Users/merwanehamadi/code/bluewind/app/api/root.tsx:41:44'
 * to 'api/root.tsx:41:44'
 */
export function getCurrentLocation(): string {
  const error = new Error();
  const stack = error.stack?.split("\n")[2];
  const match = stack?.match(/\/app\/(.*?)\)/)?.[1];
  return match || "Unknown location";
}
