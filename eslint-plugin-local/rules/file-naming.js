// eslint-plugin-local/rules/file-naming.js
/* eslint-env node */

module.exports = {
  meta: {
    type: "problem",
    fixable: null,
  },
  create(context) {
    return {
      Program(node) {
        const fileName = context.getFilename();
        const relativePath = require("path").relative(process.cwd(), fileName);
        const basename = require("path").basename(fileName);

        // Skip node_modules, generated files, and eslint-plugin-local
        if (
          relativePath.includes("node_modules") ||
          relativePath.includes("generated") ||
          basename === ".eslintrc.cjs"
        ) {
          return;
        }

        // Allow kebab-case with Remix conventions including dots for extensions
        if (!basename.match(/^[_$+]?[a-z0-9-]+(\.[a-z0-9-$]+)*\.(tsx|ts|js|jsx)$/)) {
          context.report({
            node,
            message: `Files should be kebab-case: ${basename} should be ${basename
              .toLowerCase()
              .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
          });
        }
      },
    };
  },
};
