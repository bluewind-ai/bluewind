// app/db/schema/index.ts

// Function Calls
import {
  functionCalls,
  functionCallsRelations,
  functionCallStatusEnum,
} from "./function-calls/schema";
// Models
import { modelEnum, models } from "./models/schema";
// Objects
import { objects, objectsRelations } from "./objects/schema";
// Raw Data
import { rawData, rawDataRelations } from "./raw-data/schema";
// Requests
import { requests, requestsRelations } from "./requests/schema";
// Server Functions
import {
  serverFunctions,
  serverFunctionsRelations,
  serverFunctionTypeEnum,
} from "./server-functions/schema";
// Sessions
import { sessions, sessionsRelations } from "./sessions/schema";
// Users
import { users, usersRelations } from "./users/schema";

// Tables, Enums, Relations
export {
  functionCalls,
  functionCallsRelations,
  functionCallStatusEnum,
  modelEnum,
  models,
  objects,
  objectsRelations,
  rawData,
  rawDataRelations,
  requests,
  requestsRelations,
  serverFunctions,
  serverFunctionsRelations,
  serverFunctionTypeEnum,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
};

// Combined schema object for convenience
export const schema = {
  functionCalls,
  models,
  objects,
  rawData,
  requests,
  serverFunctions,
  sessions,
  users,
  relations: {
    functionCalls: functionCallsRelations,
    objects: objectsRelations,
    rawData: rawDataRelations,
    requests: requestsRelations,
    serverFunctions: serverFunctionsRelations,
    sessions: sessionsRelations,
    users: usersRelations,
  },
  enums: {
    functionCallStatus: functionCallStatusEnum,
    model: modelEnum,
    serverFunctionType: serverFunctionTypeEnum,
  },
};
