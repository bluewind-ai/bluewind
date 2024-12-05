// app/lib/server-functions.ts
// THIS FILE IS AUTO-GENERATED - DO NOT EDIT!

import { wrapServerFunction } from "./api-wrapper";
import { buildFunctionRegistry, BuildFunctionRegistryOutput, buildFunctionRegistryInputSchema, buildFunctionRegistryOutputSchema } from "~/functions/build-function-registry.post.server";
import { buildRegistryData, BuildRegistryDataOutput, buildRegistryDataInputSchema, buildRegistryDataOutputSchema } from "~/functions/build-registry-data.post.server";
import { chat, ChatOutput, chatInputSchema, chatOutputSchema } from "~/functions/chat.server";
import { evalNewPatientBookingFlow, evalNewPatientBookingFlowInputSchema, evalNewPatientBookingFlowOutputSchema } from "~/functions/eval-new-patient-booking-flow.post.server";
import { getDirectoryHash, GetDirectoryHashOutput, getDirectoryHashInputSchema, getDirectoryHashOutputSchema } from "~/functions/get-directory-hash.post.server";
import { getFunctionList, GetFunctionListOutput, getFunctionListInputSchema, getFunctionListOutputSchema } from "~/functions/get-function-list.post.server";
import { getRequestTreeAndStoreCassette } from "~/functions/get-request-tree-and-store-cassette.server";
import { hashFunctions, HashFunctionsOutput, hashFunctionsInputSchema, hashFunctionsOutputSchema } from "~/functions/hash-functions.post.server";
import { ingestCompanyData, IngestCompanyDataOutput, ingestCompanyDataInputSchema, ingestCompanyDataOutputSchema } from "~/functions/ingest-company-data.post.server";
import { listSourceFiles, ListSourceFilesOutput, listSourceFilesInputSchema, listSourceFilesOutputSchema } from "~/functions/list-source-files.post.server";
import { loadRoutes, LoadRoutesOutput, loadRoutesInputSchema, loadRoutesOutputSchema } from "~/functions/load-routes.post.server";
import { mainFlow, MainFlowOutput, mainFlowInputSchema, mainFlowOutputSchema } from "~/functions/main-flow.post.server";
import { newBuildFunctionRegistry, BuildFunctionRegistryOutput, buildFunctionRegistryInputSchema, buildFunctionRegistryOutputSchema } from "~/functions/new-build-function-registry.post.server";
import { newBuildRegistryData, BuildRegistryDataOutput, newBuildRegistryDataInputSchema, newBuildRegistryDataOutputSchema } from "~/functions/new-build-registry-data.post.server";
import { newGetFunctionList, GetFunctionListOutput, newGetFunctionListInputSchema, newGetFunctionListOutputSchema } from "~/functions/new-get-function-list.post.server";
import { playground, PlaygroundOutput, playgroundInputSchema, playgroundOutputSchema } from "~/functions/playground.post.server";
import { replay, ReplayOutput, replayInputSchema, replayOutputSchema } from "~/functions/replay.post.server";
import { setupInitialize, SetupInitializeOutput, setupInitializeInputSchema, setupInitializeOutputSchema } from "~/functions/setup-initialize.post.server";
import { testNewMiddleware, TestNewMiddlewareOutput, testNewMiddlewareInputSchema, testNewMiddlewareOutputSchema } from "~/functions/test-new-middleware.post.server";
import { testRoute, TestRouteOutput, testRouteInputSchema, testRouteOutputSchema } from "~/functions/test-route.post.server";
import { twilio, TwilioOutput, twilioInputSchema, twilioOutputSchema } from "~/functions/twilio.post.server";
import { writeRegistry, WriteRegistryOutput, writeRegistryInputSchema, writeRegistryOutputSchema } from "~/functions/write-registry.post.server";

export const functions = {
  buildFunctionRegistry: buildFunctionRegistry,
  buildRegistryData: buildRegistryData,
  chat: chat,
  evalNewPatientBookingFlow: evalNewPatientBookingFlow,
  getDirectoryHash: getDirectoryHash,
  getFunctionList: getFunctionList,
  getRequestTreeAndStoreCassette: getRequestTreeAndStoreCassette,
  hashFunctions: hashFunctions,
  ingestCompanyData: ingestCompanyData,
  listSourceFiles: listSourceFiles,
  loadRoutes: loadRoutes,
  mainFlow: mainFlow,
  newBuildFunctionRegistry: newBuildFunctionRegistry,
  newBuildRegistryData: newBuildRegistryData,
  newGetFunctionList: newGetFunctionList,
  playground: playground,
  replay: replay,
  setupInitialize: setupInitialize,
  testNewMiddleware: testNewMiddleware,
  testRoute: testRoute,
  twilio: twilio,
  writeRegistry: writeRegistry
} as const;

export const serverFn = {
 ...Object.fromEntries(
   Object.entries(functions).map(([name, fn]) => [
     name,
     wrapServerFunction(`${name}.post.server`, fn),
   ]),
 ),
 schemas: {
    buildfunctionregistry: buildFunctionRegistryInputSchema,
    buildregistrydata: buildRegistryDataInputSchema,
    chat: chatInputSchema,
    evalnewpatientbookingflow: evalNewPatientBookingFlowInputSchema,
    getdirectoryhash: getDirectoryHashInputSchema,
    getfunctionlist: getFunctionListInputSchema,
    hashfunctions: hashFunctionsInputSchema,
    ingestcompanydata: ingestCompanyDataInputSchema,
    listsourcefiles: listSourceFilesInputSchema,
    loadroutes: loadRoutesInputSchema,
    mainflow: mainFlowInputSchema,
    newbuildfunctionregistry: buildFunctionRegistryInputSchema,
    newbuildregistrydata: newBuildRegistryDataInputSchema,
    newgetfunctionlist: newGetFunctionListInputSchema,
    playground: playgroundInputSchema,
    replay: replayInputSchema,
    setupinitialize: setupInitializeInputSchema,
    testnewmiddleware: testNewMiddlewareInputSchema,
    testroute: testRouteInputSchema,
    twilio: twilioInputSchema,
    writeregistry: writeRegistryInputSchema
 },
 outputSchemas: {
    buildfunctionregistry: buildFunctionRegistryOutputSchema,
    buildregistrydata: buildRegistryDataOutputSchema,
    chat: chatOutputSchema,
    evalnewpatientbookingflow: evalNewPatientBookingFlowOutputSchema,
    getdirectoryhash: getDirectoryHashOutputSchema,
    getfunctionlist: getFunctionListOutputSchema,
    hashfunctions: hashFunctionsOutputSchema,
    ingestcompanydata: ingestCompanyDataOutputSchema,
    listsourcefiles: listSourceFilesOutputSchema,
    loadroutes: loadRoutesOutputSchema,
    mainflow: mainFlowOutputSchema,
    newbuildfunctionregistry: buildFunctionRegistryOutputSchema,
    newbuildregistrydata: newBuildRegistryDataOutputSchema,
    newgetfunctionlist: newGetFunctionListOutputSchema,
    playground: playgroundOutputSchema,
    replay: replayOutputSchema,
    setupinitialize: setupInitializeOutputSchema,
    testnewmiddleware: testNewMiddlewareOutputSchema,
    testroute: testRouteOutputSchema,
    twilio: twilioOutputSchema,
    writeregistry: writeRegistryOutputSchema
 },
} as const;

// Export types
export type { ChatInput };