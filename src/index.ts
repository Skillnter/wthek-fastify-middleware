import { KitHttpError, KitGeneralError } from "http-error-kit";
import { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { INTERNAL_SERVER_ERROR } from "http-response-status-code";

/**
 * Configuration options for KitFastifyMiddleware and KitFastifyErrorHandler.
 */
export interface IKitFastifyMiddlewareOptions {
    /**
     * Optional logger callback or boolean flag.
     * When set to `true`, errors are logged via Fastify's built-in
     * `request.log.error` (Pino). When set to a function, the function
     * receives the error and request for custom logging.
     *
     * @default false
     */
    // eslint-disable-next-line no-unused-vars
    log?: boolean | ((error: unknown, req: FastifyRequest) => void);

    /**
     * If true, catches non-Kit errors and returns a structured 500 response
     * instead of passing raw unformatted errors to the default handler.
     *
     * @default false
     */
    handleUnknownErrors?: boolean;
}

/**
 * Returns a Fastify error handler function for applications powered by
 * `http-error-kit`. The returned handler inspects errors and, if they are
 * instances of `KitHttpError` or `KitGeneralError`, sends a structured JSON
 * response with the appropriate HTTP status code. Unrecognised errors are
 * either forwarded to Fastify's default handler or returned as a structured
 * 500 response when `handleUnknownErrors` is enabled.
 *
 * Use this when you need to pass the handler explicitly to
 * `fastify.setErrorHandler` or to a scoped Fastify plugin.
 *
 * @param {IKitFastifyMiddlewareOptions} [options] Optional configuration for the handler.
 * @returns A Fastify-compatible error handler function.
 *
 * @example
 * ```typescript
 * import Fastify from "fastify";
 * import { KitFastifyErrorHandler } from "@wthek/fastify-middleware";
 *
 * const fastify = Fastify();
 * fastify.setErrorHandler(KitFastifyErrorHandler({ log: true }));
 * ```
 */
export function KitFastifyErrorHandler(
    options?: IKitFastifyMiddlewareOptions
) {
    const { log = false, handleUnknownErrors = false } = options ?? {};

    return (
        error: unknown,
        request: FastifyRequest,
        reply: FastifyReply
    ) => {
        try {
            // Log the error when logging is enabled
            if (log) {
                if (typeof log === "function") {
                    log(error, request);
                } else {
                    request.log.error(error);
                }
            }

            // Bail out when the response has already been sent
            // to avoid FST_ERR_REP_ALREADY_SENT crashes.
            if (reply.sent) {
                return;
            }

            if (
                error instanceof KitHttpError ||
                error instanceof KitGeneralError
            ) {
                // eslint-disable-next-line
                const statusCode = (error.getInputs()?.statusCode ??
                    INTERNAL_SERVER_ERROR) as number;
                reply.status(statusCode).send(error);
            } else if (handleUnknownErrors) {
                reply.status(INTERNAL_SERVER_ERROR as number).send({
                    statusCode: INTERNAL_SERVER_ERROR as number,
                    message: "Internal Server Error",
                });
            } else {
                reply.send(error);
            }
        } catch (err) {
            if (!reply.sent) {
                reply.status(INTERNAL_SERVER_ERROR as number).send(err);
            }
        }
    };
}

/**
 * KitFastifyMiddleware is a convenience wrapper that registers the
 * `KitFastifyErrorHandler` as the global error handler on the given
 * Fastify instance via `setErrorHandler`.
 *
 * @param {FastifyInstance} app The Fastify application instance.
 * @param {IKitFastifyMiddlewareOptions} [options] Optional configuration for the middleware.
 *
 * @example
 * ```typescript
 * import Fastify from "fastify";
 * import { KitFastifyMiddleware } from "@wthek/fastify-middleware";
 *
 * const fastify = Fastify();
 * KitFastifyMiddleware(fastify, { log: true });
 * ```
 */
export function KitFastifyMiddleware(
    app: FastifyInstance,
    options?: IKitFastifyMiddlewareOptions
) {
    app.setErrorHandler(KitFastifyErrorHandler(options));
}
