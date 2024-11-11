/* eslint-env node */

module.exports = {
  meta: {
    type: "problem",
    fixable: "code", // Add this to make the rule fixable
  },
  create(context) {
    return {
      Program(node) {
        const filename = context.getFilename();
        if (!filename.includes("routes")) {
          return;
        }

        const sourceCode = context.getSourceCode();
        const loaderNode = node.body.find(
          (n) =>
            n.type === "ExportNamedDeclaration" &&
            n.declaration?.type === "FunctionDeclaration" &&
            n.declaration.id.name === "loader",
        );

        const actionNode = node.body.find(
          (n) =>
            n.type === "ExportNamedDeclaration" &&
            n.declaration?.type === "FunctionDeclaration" &&
            n.declaration.id.name === "action",
        );

        if (loaderNode) {
          const actualLoader = sourceCode.getText(loaderNode);
          const expectedLoader = `export async function loader(args: LoaderFunctionArgs) {
  return await loaderMiddleware(args, () => _loader(args));
}`;

          if (actualLoader.replace(/\s+/g, "") !== expectedLoader.replace(/\s+/g, "")) {
            context.report({
              node: loaderNode,
              message:
                "Loader must match template: 'export async function loader(args: LoaderFunctionArgs) {...}'",
              fix: (fixer) => {
                return fixer.replaceText(loaderNode, expectedLoader);
              },
            });
          }
        }

        if (actionNode) {
          const actualAction = sourceCode.getText(actionNode);
          const expectedAction = `export async function action(args: ActionFunctionArgs) {
  return await actionMiddleware(args, () => _action(args));
}`;

          if (actualAction.replace(/\s+/g, "") !== expectedAction.replace(/\s+/g, "")) {
            context.report({
              node: actionNode,
              message:
                "Action must match template: 'export async function action(args: ActionFunctionArgs) {...}'",
              fix: (fixer) => {
                return fixer.replaceText(actionNode, expectedAction);
              },
            });
          }
        }
      },
    };
  },
};
