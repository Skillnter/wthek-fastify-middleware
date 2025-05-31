import { KitHttpError, KitGeneralError } from "http-error-kit";
import { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { INTERNAL_SERVER_ERROR } from "http-response-status-code";

/**
 * Middleware function for Fastify to handle errors using `http-error-kit`.
 *
 * This middleware is designed to catch errors that are instances of `KitHttpError`
 * or `KitGeneralError`. It retrieves the status code from the error's inputs and
 * sends a response with that status code and the error details. If the error is not
 * recognized or another exception occurs, it passes control to the next middleware.
 *
 * @returns A Fastify middleware function to handle and format errors.
 */
export function KitFastifyMiddleware(app: FastifyInstance) {
    app.setErrorHandler(
        (error: any, request: FastifyRequest, reply: FastifyReply) => {
            try {
                if (
                    error instanceof KitHttpError ||
                    error instanceof KitGeneralError
                ) {
                    const statusCode = (error.getInputs()?.statusCode ||
                        INTERNAL_SERVER_ERROR) as number;
                    reply.status(statusCode).send(error);
                } else {
                    reply.send(error);
                }
            } catch (err) {
                reply.send(err);
            }
        }
    );
}
