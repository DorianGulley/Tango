/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as compatibility from "../compatibility.js";
import type * as crons from "../crons.js";
import type * as locations from "../locations.js";
import type * as matching from "../matching.js";
import type * as model from "../model.js";
import type * as seed from "../seed.js";
import type * as tango from "../tango.js";
import type * as tangoConfig from "../tangoConfig.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  compatibility: typeof compatibility;
  crons: typeof crons;
  locations: typeof locations;
  matching: typeof matching;
  model: typeof model;
  seed: typeof seed;
  tango: typeof tango;
  tangoConfig: typeof tangoConfig;
  users: typeof users;
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
