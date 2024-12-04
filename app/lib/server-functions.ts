// app/lib/server-functions.ts

import { z } from "zod";

import { chat, type ChatInput, chatInputSchema, chatOutputSchema } from "~/functions/chat.server";
import { evalNewPatientBookingFlow } from "~/functions/eval-new-patient-booking-flow";
import { getDirectoryHash } from "~/functions/get-directory-hash.get.server";
import { ingestCompanyData } from "~/functions/ingest-company-data.get.server";
import { listSourceFiles } from "~/functions/list-source-files.get.server";
import { loadRoutes } from "~/functions/load-routes.get.server";
import { mainFlow } from "~/functions/main-flow.get.server";
import { replay } from "~/functions/replay.get.server";
import { root } from "~/functions/root.server";
import { setupInitialize } from "~/functions/setup-initialize.get.server";
import { testNewMiddleware } from "~/functions/test-new-middleware.get.server";
import { testRoute } from "~/functions/test-route.get.server";
import { twilio } from "~/functions/twilio.get.server";

import { wrapServerFunction } from "./api-wrapper";

// Schemas for eval-new-patient-booking-flow
const evalNewPatientBookingFlowInputSchema = z.object({});
const evalNewPatientBookingFlowOutputSchema = z.object({
  success: z.boolean(),
  requestId: z.number(),
});

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
} as const;

export const serverFn = {
  ...Object.fromEntries(
    Object.entries(functions).map(([name, fn]) => [name, wrapServerFunction(name, fn)]),
  ),
  schemas: {
    chat: chatInputSchema,
    evalnewpatientbookingflow: evalNewPatientBookingFlowInputSchema,
  },
  outputSchemas: {
    chat: chatOutputSchema,
    evalnewpatientbookingflow: evalNewPatientBookingFlowOutputSchema,
  },
};

export type { ChatInput };
