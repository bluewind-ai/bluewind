// eslint-plugin-local/rules/file-header.js
/* eslint-env node */

module.exports = {
  meta: {
    type: "layout",
    fixable: "code",
  },
  create(context) {
    return {
      Program(node) {
        const fileName = context.getFilename();
        const relativePath = require("path").relative(process.cwd(), fileName);
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();
        const firstComment = comments[0];
        const expectedHeader = `// ${relativePath}`;

        if (!firstComment || !firstComment.value.includes(relativePath)) {
          context.report({
            node,
            message: `File header should be "${expectedHeader}"`,
            fix(fixer) {
              if (firstComment) {
                return fixer.remove(firstComment);
              }
              return fixer.insertTextBefore(node, `${expectedHeader}\n\n`);
            },
          });
        }
      },
    };
  },
};
