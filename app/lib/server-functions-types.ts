// app/lib/server-functions-types.ts
export type ServerFunctionName =
  | "truncateDb"
  | "bootstrap"
  | "updateFiles"
  | "generateRoutes"
  | "loadNavigationData";
// Import the variant type from your button component or define it inline
export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
export interface ServerFunction {
  label: string;
  variant: ButtonVariant; // Use the correct variant type
}
export const SERVER_FUNCTIONS: Record<ServerFunctionName, ServerFunction> = {
  truncateDb: {
    label: "Truncate DB",
    variant: "destructive", // These must be valid ButtonVariant values
  },
  bootstrap: {
    label: "Bootstrap",
    variant: "default",
  },
  updateFiles: {
    label: "Update Files",
    variant: "default",
  },
  generateRoutes: {
    label: "Generate Routes",
    variant: "default",
  },
  loadNavigationData: {
    label: "Load Navigation Data",
    variant: "default",
  },
};
