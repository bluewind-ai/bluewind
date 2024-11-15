const TABLES = {
  users: {
    displayName: "Users",
    urlName: "users",
  },
  sessions: {
    displayName: "Sessions",
    urlName: "sessions",
  },
  serverFunctions: {
    displayName: "Server Functions",
    urlName: "server-functions",
  },
  functionCalls: {
    displayName: "Function Calls",
    urlName: "function-calls",
  },
  requestErrors: {
    displayName: "Request Errors",
    urlName: "request-errors",
  },
  debugLogs: {
    displayName: "Debug Logs",
    urlName: "debug-logs",
  },
  objects: {
    displayName: "Objects",
    urlName: "objects",
  },
  requests: {
    displayName: "Requests",
    urlName: "requests",
  },
};

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Use TableModel enum instead of string literals for table names",
      recommended: "error",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Skip files in the schema folder
    if (filename.includes("/db/")) {
      return {};
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          const tableEntry = Object.entries(TABLES).find(
            ([key, config]) => config.urlName === node.value || key === node.value,
          );

          if (tableEntry) {
            context.report({
              node,
              message: `String literal "${node.value}" should use TableModel enum from "~/db/schema" instead`,
            });
          }
        }
      },
    };
  },
};
