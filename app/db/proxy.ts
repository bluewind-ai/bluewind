// app/db/proxy.ts

export function createDbProxy(db: typeof originalDb) {
  return new Proxy(db, {
    get(target, prop) {
      if (prop === "insert" || prop === "update") {
        return (...args: any[]) => {
          const query = target[prop](...args);
          const originalToString = query.toString;

          query.toString = function () {
            const sql = originalToString.call(this);
            if (!sql.toLowerCase().includes("returning")) {
              throw new Error(`Database ${prop} without RETURNING clause detected: ${sql}`);
            }
            return sql;
          };

          return query;
        };
      }
      return target[prop];
    },
  });
}
