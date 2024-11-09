// // app/lib/db-client.ts

// import { db } from "~/db";
// import { objects } from "~/db/schema";

// const createDbProxy = () => {
//   return new Proxy(db, {
//     get(target, prop) {
//       if (prop === "insert") {
//         return new Proxy(target.insert, {
//           apply: async (insertFn, thisArg, [table, ...args]) => {
//             // Do the original insert
//             const result = await insertFn.apply(thisArg, [table, ...args]);

//             // Get the inserted records
//             const inserted = await result.returning();

//             // Create objects copy for each inserted record
//             if (inserted.length > 0) {
//               const tableName = table.$table.name;
//               const objectType = tableNameToObjectType(tableName);

//               if (objectType) {
//                 await db.insert(objects).values(
//                   inserted.map((record) => ({
//                     objectId: record.id,
//                     objectType,
//                     data: record,
//                   })),
//                 );
//               }
//             }

//             return result;
//           },
//         });
//       }
//       return target[prop];
//     },
//   });
// };

// // Use like:
// export const db = createDbProxy();
