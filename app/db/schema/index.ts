// app/db/schema/index.ts

// Function Calls
// Models
import { modelEnum, models } from "./models/schema";
// Objects
import { objects, objectsRelations } from "./objects/schema";
// Raw Data
import { rawData, rawDataRelations } from "./raw-data/schema";
// Requests
import { requests, requestsRelations } from "./requests/schema";
// Routes
import { routes, routesRelations, routeTypeEnum } from "./routes/schema";
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
  modelEnum,
  models,
  objects,
  objectsRelations,
  rawData,
  rawDataRelations,
  requests,
  requestsRelations,
  routes,
  routesRelations,
  routeTypeEnum,
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
  models,
  objects,
  rawData,
  requests,
  routes,
  serverFunctions,
  sessions,
  users,
  relations: {
    objects: objectsRelations,
    rawData: rawDataRelations,
    requests: requestsRelations,
    routes: routesRelations,
    serverFunctions: serverFunctionsRelations,
    sessions: sessionsRelations,
    users: usersRelations,
  },
  enums: {
    model: modelEnum,
    routeType: routeTypeEnum,
    serverFunctionType: serverFunctionTypeEnum,
  },
};
