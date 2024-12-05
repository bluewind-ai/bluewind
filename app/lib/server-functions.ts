// app/lib/server-functions.ts

import {
  buildFunctionRegistry,
  buildFunctionRegistryInputSchema,
  buildFunctionRegistryOutputSchema,
} from "~/functions/build-function-registry.post.server";
import {
  buildRegistryData,
  buildRegistryDataInputSchema,
  buildRegistryDataOutputSchema,
} from "~/functions/build-registry-data.post.server";
import { chat, type ChatInput, chatInputSchema, chatOutputSchema } from "~/functions/chat.server";
import {
  evalNewPatientBookingFlow,
  evalNewPatientBookingFlowInputSchema,
  evalNewPatientBookingFlowOutputSchema,
} from "~/functions/eval-new-patient-booking-flow";
import {
  getDirectoryHash,
  getDirectoryHashInputSchema,
  getDirectoryHashOutputSchema,
} from "~/functions/get-directory-hash.post.server";
import {
  getFunctionList,
  getFunctionListInputSchema,
  getFunctionListOutputSchema,
} from "~/functions/get-function-list.post.server";
import {
  ingestCompanyData,
  ingestCompanyDataInputSchema,
  ingestCompanyDataOutputSchema,
} from "~/functions/ingest-company-data.post.server";
import {
  listSourceFiles,
  listSourceFilesInputSchema,
  listSourceFilesOutputSchema,
} from "~/functions/list-source-files.post.server";
import {
  loadRoutes,
  loadRoutesInputSchema,
  loadRoutesOutputSchema,
} from "~/functions/load-routes.post.server";
import {
  mainFlow,
  mainFlowInputSchema,
  mainFlowOutputSchema,
} from "~/functions/main-flow.post.server";
import { replay, replayInputSchema, replayOutputSchema } from "~/functions/replay.post.server";
import { root, rootInputSchema, rootOutputSchema } from "~/functions/root.server";
import {
  setupInitialize,
  setupInitializeInputSchema,
  setupInitializeOutputSchema,
} from "~/functions/setup-initialize.post.server";
import {
  testNewMiddleware,
  testNewMiddlewareInputSchema,
  testNewMiddlewareOutputSchema,
} from "~/functions/test-new-middleware.post.server";
import {
  testRoute,
  testRouteInputSchema,
  testRouteOutputSchema,
} from "~/functions/test-route.post.server";
import { twilio, twilioInputSchema, twilioOutputSchema } from "~/functions/twilio.post.server";
import {
  writeRegistry,
  writeRegistryInputSchema,
  writeRegistryOutputSchema,
} from "~/functions/write-registry.post.server";

import { wrapServerFunction } from "./api-wrapper";

export const functions = {
  testNewMiddleware,
  listSourceFiles,
  getDirectoryHash,
  ingestCompanyData,
  loadRoutes,
  setupInitialize,
  mainFlow,
  testRoute,
  root,
  chat,
  evalNewPatientBookingFlow,
  twilio,
  replay,
  buildFunctionRegistry,
  getFunctionList,
  buildRegistryData,
  writeRegistry,
} as const;

export const serverFn = {
  ...Object.fromEntries(
    Object.entries(functions).map(([name, fn]) => [
      name,
      wrapServerFunction(`${name}.post.server`, fn),
    ]),
  ),
  schemas: {
    chat: chatInputSchema,
    evalnewpatientbookingflow: evalNewPatientBookingFlowInputSchema,
    replay: replayInputSchema,
    testnewmiddleware: testNewMiddlewareInputSchema,
    listsourcefiles: listSourceFilesInputSchema,
    getdirectoryhash: getDirectoryHashInputSchema,
    ingestcompanydata: ingestCompanyDataInputSchema,
    loadroutes: loadRoutesInputSchema,
    setupinitialize: setupInitializeInputSchema,
    mainflow: mainFlowInputSchema,
    testroute: testRouteInputSchema,
    root: rootInputSchema,
    twilio: twilioInputSchema,
    buildfunctionregistry: buildFunctionRegistryInputSchema,
    getfunctionlist: getFunctionListInputSchema,
    buildregistrydata: buildRegistryDataInputSchema,
    writeregistry: writeRegistryInputSchema,
  },
  outputSchemas: {
    chat: chatOutputSchema,
    evalnewpatientbookingflow: evalNewPatientBookingFlowOutputSchema,
    replay: replayOutputSchema,
    testnewmiddleware: testNewMiddlewareOutputSchema,
    listsourcefiles: listSourceFilesOutputSchema,
    getdirectoryhash: getDirectoryHashOutputSchema,
    ingestcompanydata: ingestCompanyDataOutputSchema,
    loadroutes: loadRoutesOutputSchema,
    setupinitialize: setupInitializeOutputSchema,
    mainflow: mainFlowOutputSchema,
    testroute: testRouteOutputSchema,
    root: rootOutputSchema,
    twilio: twilioOutputSchema,
    buildfunctionregistry: buildFunctionRegistryOutputSchema,
    getfunctionlist: getFunctionListOutputSchema,
    buildregistrydata: buildRegistryDataOutputSchema,
    writeregistry: writeRegistryOutputSchema,
  },
};

// Export types
export type { ChatInput };
