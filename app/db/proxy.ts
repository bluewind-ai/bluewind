// // app/db/proxy.ts

// import { and, type DBQueryConfig, eq, type SQLWrapper } from "drizzle-orm";
// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres, { type Sql } from "postgres";

// import { AnyArgs } from ".";
// import {
//   type DbClient,
//   type DbTable,
//   type DeleteArgs,
//   type DeleteFn,
//   type FindArgs,
//   type FindFn,
//   type FromArgs,
//   type FromFn,
//   type InsertArgs,
//   type JoinArgs,
//   type JoinFn,
//   type Owner,
//   type RlsDbClient,
//   type SetArgs,
//   type SetFn,
//   type UpdateArgs,
//   type ValuesArgs,
//   type ValuesFn,
//   type WhereArgs,
//   type WhereFn,
// } from "./proxy.types";
// import * as schema from "./schema";

// export const connectDb = (connectionString: string) => {
//   return postgres(connectionString);
// };

// export const createDbClient = (client: Sql): DbClient => {
//   return drizzle(client, { schema });
// };

// export const createRlsDbClient = (client: Sql, owner: Owner): RlsDbClient => {
//   const db = createDbClient(client);

//   const ownerIdColumn = "ownerId" as const;

//   const getTable = (table: DbTable) => {
//     if (!(table in schema)) {
//       throw new Error(`Table ${table} not found in schema`);
//     }
//     return Object.values(schema).find((t) => t.name === table);
//   };

//   const getAccessPolicy = (
//     table: {
//       [ownerIdColumn]: any;
//     },
//     owner: Owner,
//   ) => eq(table[ownerIdColumn], owner.id);

//   interface InvokeContext {
//     path?: string[];
//     fnPath?: { name: string; args: unknown[] }[];
//   }

//   interface InterceptFn {
//     invoke: (...args: unknown[]) => unknown;
//     name: string;
//     args: unknown[];
//   }

//   interface OverrideFn {
//     pattern: string | string[];
//     action: () => unknown;
//   }

//   const intercept = (fn: InterceptFn, context: InvokeContext = {}) => {
//     const { path = [], fnPath = [] } = context;

//     const pathAsString = path.join(".");

//     const matchPath = (pattern: string) => {
//       return new RegExp(`^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`).test(
//         pathAsString,
//       );
//     };

//     const overrides: OverrideFn[] = [
//       {
//         pattern: ["db.execute", "db.*.execute"],
//         action: () => {
//           throw new Error("'execute' in rls DB is not allowed");
//         },
//       },
//       {
//         pattern: [
//           "db.query.findMany",
//           "db.query.*.findMany",
//           "db.query.findFirst",
//           "db.query.*.findFirst",
//         ],
//         action: () => {
//           const findFn = fn.invoke as FindFn;
//           const findArgs = fn.args as FindArgs;

//           const tableIndex = path.findIndex((x) => x === "query") + 1;
//           const tableName = path[tableIndex]! as keyof typeof db.query;
//           const table = getTable(tableName as DbTable);

//           if (ownerIdColumn in table) {
//             let [config] = findArgs;

//             if (config?.where) {
//               config = {
//                 ...config,
//                 where: and(getAccessPolicy(table, owner), config.where as SQLWrapper),
//               };
//             }

//             if (!config?.where) {
//               config = {
//                 ...config,
//                 where: getAccessPolicy(table, owner),
//               };
//             }

//             if (config.with) {
//               config = {
//                 ...config,
//                 with: (Object.keys(config.with) as (keyof typeof config.with)[]).reduce<
//                   DBQueryConfig["with"]
//                 >((acc, key) => {
//                   const value = config!.with![key] as true | null | DBQueryConfig<"many">;

//                   if (value === true) {
//                     return {
//                       ...acc,
//                       [key]: {
//                         where: (table) =>
//                           ownerIdColumn in table ? getAccessPolicy(table as any, owner) : undefined,
//                       },
//                     };
//                   }

//                   if (typeof value === "object" && value !== null) {
//                     return {
//                       ...acc,
//                       [key]: {
//                         ...value,
//                         where: (table, other) =>
//                           ownerIdColumn in table
//                             ? and(
//                                 getAccessPolicy(table as any, owner),
//                                 typeof value.where === "function"
//                                   ? value.where(table, other)
//                                   : value.where,
//                               )
//                             : typeof value.where === "function"
//                               ? value.where(table, other)
//                               : value.where,
//                       },
//                     };
//                   }

//                   return { ...acc, [key]: value };
//                 }, config.with as any),
//               };
//             }

//             return findFn(...([config] as FindArgs));
//           }

//           return findFn(...findArgs);
//         },
//       },
//       {
//         pattern: "db.*.from",
//         action: () => {
//           const fromFn = fn.invoke as FromFn;
//           const fromArgs = fn.args as FromArgs;

//           const [table] = fromArgs;

//           if (ownerIdColumn in table) {
//             return fromFn(...fromArgs).where(getAccessPolicy(table, owner));
//           }

//           return fromFn(...fromArgs);
//         },
//       },
//       {
//         pattern: ["db.*.from.where", "db.*.from.*.where"],
//         action: () => {
//           const whereFn = fn.invoke as WhereFn;
//           const whereArgs = fn.args as WhereArgs;

//           const [table] = [...fnPath].reverse().find((x) => x.name === "from")?.args as FromArgs;

//           if (ownerIdColumn in table) {
//             const [whereFilter] = whereArgs;

//             return whereFn(and(getAccessPolicy(table, owner), whereFilter as SQLWrapper));
//           }

//           return whereFn(...whereArgs);
//         },
//       },
//       {
//         pattern: ["db.*.leftJoin", "db.*.rightJoin", "db.*.innerJoin", "db.*.fullJoin"],
//         action: () => {
//           const joinFn = fn.invoke as JoinFn;
//           const joinArgs = fn.args as JoinArgs;

//           const [table, joinOptions] = joinArgs;

//           if (ownerIdColumn in table) {
//             return joinFn(table, and(getAccessPolicy(table, owner), joinOptions as SQLWrapper));
//           }

//           return joinFn(...joinArgs);
//         },
//       },
//       {
//         pattern: "db.insert.values",
//         action: () => {
//           const valuesFn = fn.invoke as ValuesFn;
//           const valuesArgs = fn.args as ValuesArgs;

//           const [table] = [...fnPath].reverse().find((x) => x.name === "insert")
//             ?.args as InsertArgs;

//           if (ownerIdColumn in table) {
//             let [valuesToInsert] = valuesArgs;

//             if (!Array.isArray(valuesToInsert)) {
//               valuesToInsert = [valuesToInsert];
//             }

//             const valuesToInsertWithOwner = valuesToInsert.map((value) => ({
//               ...value,
//               ownerId: owner.id,
//             }));

//             return valuesFn(valuesToInsertWithOwner);
//           }

//           return valuesFn(...valuesArgs);
//         },
//       },
//       {
//         pattern: "db.update.set",
//         action: () => {
//           const setFn = fn.invoke as SetFn;
//           const setArgs = fn.args as SetArgs;

//           const [table] = [...fnPath].reverse().find((x) => x.name === "update")
//             ?.args as UpdateArgs;

//           if (ownerIdColumn in table) {
//             return setFn(...setArgs).where(getAccessPolicy(table, owner));
//           }

//           return setFn(...setArgs);
//         },
//       },
//       {
//         pattern: ["db.update.where", "db.update.*.where"],
//         action: () => {
//           const whereFn = fn.invoke as WhereFn;
//           const whereArgs = fn.args as WhereArgs;

//           const [table] = [...fnPath].reverse().find((x) => x.name === "update")
//             ?.args as UpdateArgs;

//           if (ownerIdColumn in table) {
//             const [whereFilter] = whereArgs;

//             return whereFn(and(getAccessPolicy(table, owner), whereFilter as SQLWrapper));
//           }

//           return whereFn(...whereArgs);
//         },
//       },
//       {
//         pattern: "db.delete",
//         action: () => {
//           const deleteFn = fn.invoke as DeleteFn;
//           const deleteArgs = fn.args as DeleteArgs;

//           const [table] = deleteArgs;

//           if (ownerIdColumn in table) {
//             return deleteFn(...deleteArgs).where(getAccessPolicy(table, owner));
//           }

//           return deleteFn(...deleteArgs);
//         },
//       },
//       {
//         pattern: ["db.delete.where", "db.delete.*.where"],
//         action: () => {
//           const whereFn = fn.invoke as WhereFn;
//           const whereArgs = fn.args as WhereArgs;

//           const [table] = [...fnPath].reverse().find((x) => x.name === "delete")
//             ?.args as DeleteArgs;

//           if (ownerIdColumn in table) {
//             const [whereOptions] = whereArgs;

//             return whereFn(and(getAccessPolicy(table, owner), whereOptions as SQLWrapper));
//           }

//           return whereFn(...whereArgs);
//         },
//       },
//     ];

//     const fnOverride = overrides.find(({ pattern, action }) => {
//       if (Array.isArray(pattern) && pattern.some(matchPath)) {
//         return action;
//       }

//       if (typeof pattern === "string" && matchPath(pattern)) {
//         return action;
//       }

//       return null;
//     })?.action;

//     return fnOverride ? fnOverride() : fn.invoke(...fn.args);
//   };

//   const createProxy = <T extends object>(target: T, context: InvokeContext = {}): T => {
//     const { path = [], fnPath = [] } = context;

//     return new Proxy<T>(target, {
//       get: (innerTarget, innerTargetProp, innerTargetReceiver) => {
//         const currentPath = path.concat(innerTargetProp.toString());
//         const innerTargetPropValue = Reflect.get(innerTarget, innerTargetProp, innerTargetReceiver);

//         if (typeof innerTargetPropValue === "function") {
//           return (...args: AnyArgs) => {
//             const currentFnPath = [...fnPath, { name: innerTargetProp.toString(), args }];

//             const result = intercept(
//               {
//                 invoke: innerTargetPropValue.bind(innerTarget) as InterceptFn["invoke"],
//                 name: innerTargetProp.toString(),
//                 args,
//               },
//               { path: currentPath, fnPath: currentFnPath },
//             );

//             if (typeof result === "object" && result !== null && !Array.isArray(result)) {
//               return createProxy(result, {
//                 path: currentPath,
//                 fnPath: currentFnPath,
//               });
//             }

//             return result;
//           };
//         } else if (
//           typeof innerTargetPropValue === "object" &&
//           innerTargetPropValue !== null &&
//           !Array.isArray(innerTargetPropValue)
//         ) {
//           return createProxy(innerTargetPropValue, {
//             path: currentPath,
//             fnPath,
//           });
//         }

//         return innerTargetPropValue;
//       },
//     });
//   };

//   return createProxy(db, { path: ["db"] });
// };
