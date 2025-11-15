/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as carfax from "../carfax.js";
import type * as elevenlabs from "../elevenlabs.js";
import type * as elevenlabsActions from "../elevenlabsActions.js";
import type * as gemini from "../gemini.js";
import type * as http from "../http.js";
import type * as solana from "../solana.js";
import type * as solanaPayment from "../solanaPayment.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  carfax: typeof carfax;
  elevenlabs: typeof elevenlabs;
  elevenlabsActions: typeof elevenlabsActions;
  gemini: typeof gemini;
  http: typeof http;
  solana: typeof solana;
  solanaPayment: typeof solanaPayment;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
