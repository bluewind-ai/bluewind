module.exports = {
  rules: {
    "file-header": require("./rules/file-header.cjs"),
    "file-naming": require("./rules/file-naming.cjs"),
    // "route-template-check": require("./rules/route-template-check.cjs"),
    "no-table-literals": require("./rules/no-table-literals.cjs"),
  },
};
