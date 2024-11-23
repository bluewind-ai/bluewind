// app/lib/server-functions-types.ts

export type ServerFunctionName =
  | "bootstrap"
  | "updateFiles"
  | "generateRoutes"
  | "loadNavigationData"
  | "goNext";

// Import the variant type from your button component or define it inline
export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

export interface ServerFunction {
  label: string;
  variant: ButtonVariant; // Use the correct variant type
}

export const SERVER_FUNCTIONS: Record<ServerFunctionName, ServerFunction> = {
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
  goNext: {
    label: "Go Next",
    variant: "default",
  },
};
