// Core exports
export { BunAdapter } from "./bun-adapter";
export { NestBunFactory } from "./nest-bun-application";

// Interface exports
export type {
  BunServerOptions,
  BunRequest,
  NestBunApplication,
  NestBunApplicationOptions,
} from "./interfaces";

// Express compatibility exports
export {
  createExpressRequest,
  createExpressResponse,
  type ExpressRequest,
  type ExpressResponse,
  type ExpressMiddleware,
  type ExpressErrorMiddleware,
} from "./express-compat";

// Fastify compatibility exports
export {
  createFastifyRequest,
  createFastifyReply,
  FastifyHooksManager,
  FastifyPluginRegistry,
  type FastifyRequest,
  type FastifyReply,
  type FastifyPlugin,
  type FastifyInstance,
  type FastifyHookName,
  type FastifyOnRequestHook,
  type FastifyPreHandlerHook,
  type FastifyOnSendHook,
  type FastifyOnErrorHook,
  type FastifyOnResponseHook,
  type FastifyRouteHandler,
  type FastifyMiddleware,
} from "./fastify-compat";

// Utility exports
export {
  parseQueryParams,
  parseBody,
  enhanceRequest,
  getHeader,
  accepts,
  getIp,
  type ParsedRequest,
} from "./utils/request";

export {
  ResponseBuilder,
  response,
  json,
  text,
  html,
  error,
} from "./utils/response";
