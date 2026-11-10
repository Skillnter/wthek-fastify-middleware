import { KitFastifyMiddleware, KitFastifyErrorHandler } from "../src";
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
            sent: false,
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
        error.getInputs = () => undefined as any;
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
        let firstCall = true;
        reply = {
            sent: false,
            status: jest.fn().mockImplementation(() => {
                if (firstCall) {
                    firstCall = false;
                    throw catchError;
                }
                return reply;
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

        expect(reply.status).toHaveBeenCalledTimes(2);
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

describe("KitFastifyMiddleware - reply.sent guard", () => {
    let request: FastifyRequest;

    beforeEach(() => {
        request = {
            log: { error: jest.fn().mockReturnThis() },
        } as unknown as FastifyRequest;
    });

    it("should bail out when reply has already been sent", async () => {
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        const reply = {
            sent: true,
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).not.toHaveBeenCalled();
        expect(reply.send).not.toHaveBeenCalled();
    });

    it("should bail out for non-Kit errors when reply has already been sent", async () => {
        const error = new Error("Unknown Error");
        const reply = {
            sent: true,
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).not.toHaveBeenCalled();
        expect(reply.send).not.toHaveBeenCalled();
    });
});

describe("KitFastifyMiddleware - logging option", () => {
    let request: FastifyRequest;
    let reply: FastifyReply;

    beforeEach(() => {
        request = {
            log: { error: jest.fn().mockReturnThis() },
        } as unknown as FastifyRequest;
        reply = {
            sent: false,
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
    });

    it("should log errors via request.log.error when log is true", async () => {
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify, { log: true });
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(request.log.error).toHaveBeenCalledWith(error);
        expect(reply.status).toHaveBeenCalledWith(400);
    });

    it("should log errors via custom logger function", async () => {
        const customLogger = jest.fn();
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify, { log: customLogger });
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(customLogger).toHaveBeenCalledWith(error, request);
        expect(reply.status).toHaveBeenCalledWith(400);
    });

    it("should not log errors when log is false (default)", async () => {
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(request.log.error).not.toHaveBeenCalled();
    });
});

describe("KitFastifyMiddleware - handleUnknownErrors option", () => {
    let request: FastifyRequest;
    let reply: FastifyReply;

    beforeEach(() => {
        request = {
            log: { error: jest.fn().mockReturnThis() },
        } as unknown as FastifyRequest;
        reply = {
            sent: false,
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
    });

    it("should return structured 500 response for non-Kit errors when handleUnknownErrors is true", async () => {
        const error = new Error("Unknown Error");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify, { handleUnknownErrors: true });
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(500);
        expect(reply.send).toHaveBeenCalledWith({
            statusCode: 500,
            message: "Internal Server Error",
        });
    });

    it("should still pass to default handler when handleUnknownErrors is false (default)", async () => {
        const error = new Error("Unknown Error");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).not.toHaveBeenCalled();
        expect(reply.send).toHaveBeenCalledWith(error);
    });

    it("should still handle KitHttpError normally when handleUnknownErrors is true", async () => {
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify, { handleUnknownErrors: true });
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith(error);
    });
});

describe("KitFastifyMiddleware - catch block safety", () => {
    it("should not send when reply is already sent in catch block", async () => {
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        const catchError = new Error("Something went wrong");
        const reply = {
            sent: false,
            status: jest.fn().mockImplementation(() => {
                (reply as any).sent = true;
                throw catchError;
            }),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
        const request = {
            log: { error: jest.fn().mockReturnThis() },
        } as unknown as FastifyRequest;
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;
        await KitFastifyMiddleware(fastify);
        const handler = setErrorHandler.mock.calls[0][0];

        await handler.call(fastify, error, request, reply);

        expect(reply.send).not.toHaveBeenCalled();
    });
});


describe("KitFastifyErrorHandler", () => {
    let request: FastifyRequest;
    let reply: FastifyReply;

    beforeEach(() => {
        request = {
            log: { error: jest.fn().mockReturnThis() },
        } as unknown as FastifyRequest;
        reply = {
            sent: false,
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
    });

    it("should return a function", () => {
        const handler = KitFastifyErrorHandler();
        expect(typeof handler).toBe("function");
    });

    it("should handle KitHttpError when used directly", async () => {
        const handler = KitFastifyErrorHandler();
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");

        handler(error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith(error);
    });

    it("should handle non-Kit errors with default behavior", async () => {
        const handler = KitFastifyErrorHandler();
        const error = new Error("Unknown Error");

        handler(error, request, reply);

        expect(reply.status).not.toHaveBeenCalled();
        expect(reply.send).toHaveBeenCalledWith(error);
    });

    it("should handle non-Kit errors with handleUnknownErrors", async () => {
        const handler = KitFastifyErrorHandler({ handleUnknownErrors: true });
        const error = new Error("Unknown Error");

        handler(error, request, reply);

        expect(reply.status).toHaveBeenCalledWith(500);
        expect(reply.send).toHaveBeenCalledWith({
            statusCode: 500,
            message: "Internal Server Error",
        });
    });

    it("should log via request.log.error when log is true", async () => {
        const handler = KitFastifyErrorHandler({ log: true });
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");

        handler(error, request, reply);

        expect(request.log.error).toHaveBeenCalledWith(error);
    });

    it("should log via custom logger function", async () => {
        const customLogger = jest.fn();
        const handler = KitFastifyErrorHandler({ log: customLogger });
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");

        handler(error, request, reply);

        expect(customLogger).toHaveBeenCalledWith(error, request);
    });

    it("should bail out when reply is already sent", async () => {
        reply = {
            sent: true,
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as FastifyReply;
        const handler = KitFastifyErrorHandler();
        const error = new KitHttpError(BAD_REQUEST, "Bad Request");

        handler(error, request, reply);

        expect(reply.status).not.toHaveBeenCalled();
        expect(reply.send).not.toHaveBeenCalled();
    });

    it("should work when passed to setErrorHandler explicitly", async () => {
        const setErrorHandler = jest.fn();
        const fastify = {
            setErrorHandler,
        } as unknown as FastifyInstance;

        fastify.setErrorHandler(KitFastifyErrorHandler({ log: true }));

        expect(setErrorHandler).toHaveBeenCalledTimes(1);
        const handler = setErrorHandler.mock.calls[0][0];
        expect(typeof handler).toBe("function");

        const error = new KitHttpError(BAD_REQUEST, "Bad Request");
        handler(error, request, reply);

        expect(request.log.error).toHaveBeenCalledWith(error);
        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith(error);
    });
});
