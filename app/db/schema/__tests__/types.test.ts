// // app/db/schema/__tests__/types.test.ts
// import { expectTypeOf } from "expect-type";
// import * as schema from "../index";
// // Get only tables with $inferSelect
// type Tables = {
//   [K in keyof typeof schema]: (typeof schema)[K] extends { $inferSelect: any }
//     ? (typeof schema)[K]["$inferSelect"]
//     : never;
// };
// // Test each table type
// type Tests = {
//   [K in keyof Tables]: Tables[K] extends {
//     requestId: number;
//     functionCallId: number;
//   }
//     ? true
//     : `Missing required fields in ${K & string}`;
// };
// // This will fail compilation and show which tables are missing fields
// expectTypeOf<Tests>().toEqualTypeOf<Record<keyof Tables, true>>();
