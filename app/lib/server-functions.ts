// app/lib/server-functions.ts

import {
  buildFunctionRegistry,
  buildFunctionRegistryInputSchema,
  buildFunctionRegistryOutputSchema,
} from "~/functions/build-function-registry.get.server";
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
} from "~/functions/get-directory-hash.get.server";
import {
  ingestCompanyData,
  ingestCompanyDataInputSchema,
  ingestCompanyDataOutputSchema,
} from "~/functions/ingest-company-data.get.server";
import {
  listSourceFiles,
  listSourceFilesInputSchema,
  listSourceFilesOutputSchema,
} from "~/functions/list-source-files.get.server";
import {
  loadRoutes,
  loadRoutesInputSchema,
  loadRoutesOutputSchema,
} from "~/functions/load-routes.get.server";
import {
  mainFlow,
  mainFlowInputSchema,
  mainFlowOutputSchema,
} from "~/functions/main-flow.get.server";
import { replay, replayInputSchema, replayOutputSchema } from "~/functions/replay.get.server";
import { root, rootInputSchema, rootOutputSchema } from "~/functions/root.server";
import {
  setupInitialize,
  setupInitializeInputSchema,
  setupInitializeOutputSchema,
} from "~/functions/setup-initialize.get.server";
import {
  testNewMiddleware,
  testNewMiddlewareInputSchema,
  testNewMiddlewareOutputSchema,
} from "~/functions/test-new-middleware.get.server";
import {
  testRoute,
  testRouteInputSchema,
  testRouteOutputSchema,
} from "~/functions/test-route.get.server";
import { twilio, twilioInputSchema, twilioOutputSchema } from "~/functions/twilio.get.server";

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
} as const;

export const serverFn = {
  ...Object.fromEntries(
    Object.entries(functions).map(([name, fn]) => [name, wrapServerFunction(name, fn)]),
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
  },
};

// Export types
export type { ChatInput };
