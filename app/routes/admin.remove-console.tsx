// app/routes/admin.remove-console.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Project } from "ts-morph";

export async function loader({ request }: LoaderFunctionArgs) {
  const project = new Project();
  project.addSourceFilesAtPaths("app/**/*.{ts,tsx}");
  const sourceFiles = project.getSourceFiles();

  let totalRemoved = 0;
  let modifiedFiles = 0;

  for (const sourceFile of sourceFiles) {
    const callExpressions = sourceFile.getDescendantsOfKind(4);
    let count = 0;

    callExpressions.forEach((callExpr) => {
      const expression = callExpr.getExpression();
      if (expression.getText().startsWith("console.")) {
        callExpr.remove();
        count++;
      }
    });

    if (count > 0) {
      sourceFile.saveSync();
      totalRemoved += count;
      modifiedFiles++;
    }
  }

  return json({
    success: true,
    totalRemoved,
    modifiedFiles,
    message: `Removed ${totalRemoved} console.log calls from ${modifiedFiles} files`,
  });
}

export default function RemoveConsole() {
  return null;
}
