import { KitFastifyMiddleware } from "../src";
import { KitHttpError, KitHttpErrorConfig } from "http-error-kit";
import { KitGeneralError } from "http-error-kit/generic";
import { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { INTERNAL_SERVER_ERROR, BAD_REQUEST } from "http-response-status-code";

describe("KitFastifyMiddleware", () => {
    let request: FastifyRequest;
    let reply: FastifyReply;

    beforeEach(() => {
        request = {
            log: { error: jest.fn().mockReturnThis() },
        } as unknown as FastifyRequest;
        reply = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
    });

    it("should handle KitHttpError instance without formatted error", async () => {
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        expect(setErrorHandler).toHaveBeenCalledTimes(1);
        expect(typeof setErrorHandler.mock.calls[0][0]).toBe("function");
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith(error);
    });

    it("should handle KitGeneralError instance without formatted error", async () => {
        const error = new KitGeneralError(BAD_REQUEST, "Internal Server Error");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        expect(setErrorHandler).toHaveBeenCalledTimes(1);
        expect(typeof setErrorHandler.mock.calls[0][0]).toBe("function");
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith(error);
    });

    it("should handle KitHttpError instance with formatted error", async () => {
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        KitHttpErrorConfig.configureFormatter(() => ({
            statusCode: BAD_REQUEST,
        }));
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        expect(setErrorHandler).toHaveBeenCalledTimes(1);
        expect(typeof setErrorHandler.mock.calls[0][0]).toBe("function");
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith(error);
    });

    it("should handle error when status code is not set", async () => {
        const error = new KitGeneralError(0, "Bad Request");
        error.getInputs = () => undefined;
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        expect(setErrorHandler).toHaveBeenCalledTimes(1);
        expect(typeof setErrorHandler.mock.calls[0][0]).toBe("function");
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(500);
        expect(reply.send).toHaveBeenCalledWith(error);
    });

    it("should handle non-KitHttpError/KitGeneralError instance", async () => {
        const error = new Error("Unknown Error");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        expect(setErrorHandler).toHaveBeenCalledTimes(1);
        expect(typeof setErrorHandler.mock.calls[0][0]).toBe("function");
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).not.toHaveBeenCalled();
        expect(reply.send).toHaveBeenCalledWith(error);
    });

    it("should handle error with catch block", async () => {
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        const catchError = new Error("Something went wrong");
        reply = {
            status: jest.fn().mockImplementation(() => {
                throw catchError;
            }),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        expect(setErrorHandler).toHaveBeenCalledTimes(1);
        expect(typeof setErrorHandler.mock.calls[0][0]).toBe("function");
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).toHaveBeenCalled();
        expect(reply.send).toHaveBeenCalledWith(catchError);
    });

    it("should handle KitGeneralError instance with formatted error", async () => {
        KitHttpErrorConfig.configureFormatter(() => ({
            statusCode: INTERNAL_SERVER_ERROR,
        }));
        const error = new KitGeneralError(
            INTERNAL_SERVER_ERROR,
            "Internal Server Error"
        );
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        expect(setErrorHandler).toHaveBeenCalledTimes(1);
        expect(typeof setErrorHandler.mock.calls[0][0]).toBe("function");
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(500);
        expect(reply.send).toHaveBeenCalledWith(error);
    });
});
