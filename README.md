# Official @wthek Extension – Fastify Middleware for `http-error-kit`

**Seamless Fastify Error Handling with @wthek**

_Built for applications powered by [http-error-kit][http-error-kit], this middleware ensures that all `http-error-kit` errors are properly formatted and returned with the correct HTTP status codes._

> 💡 What the HEK?! Need a hassle-free way to manage error responses for `http-error-kit` errors in Fastify? `@wthek/fastify-middleware` has got you covered!

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/skillnter/wthek-fastify-middleware/main.yml)
[![npm version](https://img.shields.io/npm/v/%40wthek%2Ffastify-middleware?color=brightgreen)](https://www.npmjs.com/package/@wthek/fastify-middleware)
[![GitHub license](https://img.shields.io/github/license/skillnter/wthek-fastify-middleware?color=brightgreen)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/Skillnter/wthek-fastify-middleware)](https://github.com/Skillnter/wthek-fastify-middleware/issues)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/bf305cd8aa0146568be65560e52fa8d4)](https://app.codacy.com/gh/Skillnter/wthek-fastify-middleware/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bf305cd8aa0146568be65560e52fa8d4)](https://app.codacy.com/gh/Skillnter/wthek-fastify-middleware/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
![npms.io (final)](https://img.shields.io/npms-io/maintenance-score/%40wthek%2Ffastify-middleware?color=brightgreen)
![npm](https://img.shields.io/npm/dy/%40wthek%2Ffastify-middleware)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@wthek/fastify-middleware/1.1.0)](https://socket.dev/npm/package/@wthek/fastify-middleware/overview/1.1.0)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-121013?logo=github&logoColor=white)](https://skillnter.github.io/wthek-fastify-middleware/)
[![Github Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-30363D?&logo=GitHub-Sponsors&logoColor=EA4AAA)](https://github.com/sponsors/Skillnter)
[![Open Collective](https://img.shields.io/badge/Open%20Collective-3385FF?logo=open-collective&logoColor=white)](https://opencollective.com/skillnter)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/skillnter)
[![Patreon](https://img.shields.io/badge/Patreon-F96854?logo=patreon&logoColor=white)](https://www.patreon.com/skillnter)
[![PayPal](https://img.shields.io/badge/PayPal-003087?logo=paypal&logoColor=fff)](https://www.paypal.me/skillnte)

## Features

-   **Official `http-error-kit` Extension** – The recommended middleware for Fastify apps.
-   **Auto-sets HTTP status codes** – Ensures the response status matches the error type.
-   **Plug-and-Play Middleware** – Just drop it before starting your server!
-   **Graceful Fallbacks** – Passes unrecognized errors to the default Fastify error handler.
-   **`reply.sent` Guard** – Prevents `FST_ERR_REP_ALREADY_SENT` crashes when the response has already been sent.
-   **Configurable Logging** – Enable built-in Pino logging (`request.log.error`) or provide your own logger callback.
-   **`handleUnknownErrors` Option** – Optionally catch non-Kit errors and return a structured 500 response.

## Table of Content

-   [Installation](#installation)
-   [Usage](#usage)
-   [Options](#options)
-   [How It Works](#how-it-works)
-   [Why Use @wthek/fastify-middleware?](#why-use-wthekfastify-middleware)
-   [Explore More WTHek Extensions](#explore-more-wthek-extensions)
-   [People](#people)
-   [Donations](#donations)
-   [License](#license)

## Installation

```console
npm install @wthek/fastify-middleware
```

## Usage

**Add Middleware Just Before Starting the Server**

To catch all errors correctly, call `KitFastifyMiddleware(app)` after all routes but before starting your Fastify server.

```Javascript
import Fastify from "fastify";
import { KitHttpError } from "http-error-kit";
import { KitFastifyMiddleware } from "@wthek/fastify-middleware";

const fastify = Fastify({ logger: true });

KitFastifyMiddleware(fastify);

fastify.get("/", async (request, reply) => {
    throw new KitHttpError(400, "Bad Request");
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
        console.log("Server running at http://localhost:3000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
```

**With Options**

```Javascript
import Fastify from "fastify";
import { KitFastifyMiddleware } from "@wthek/fastify-middleware";

const fastify = Fastify({ logger: true });

KitFastifyMiddleware(fastify, {
    log: true,                // Log errors via Fastify's built-in Pino logger
    handleUnknownErrors: true // Return structured 500 for non-Kit errors
});
```

**Custom Logger**

```Javascript
import Fastify from "fastify";
import { KitFastifyMiddleware } from "@wthek/fastify-middleware";

const fastify = Fastify({ logger: true });

KitFastifyMiddleware(fastify, {
    log: (error, request) => {
        // Custom logging logic (e.g. Winston, Pino, Bunyan, Sentry)
        console.error(`[${request.method}] ${request.url}`, error);
    }
});
```

**Using `KitFastifyErrorHandler` Directly**

If you prefer explicit control or need to register the handler on a scoped plugin, use `KitFastifyErrorHandler` instead:

```Javascript
import Fastify from "fastify";
import { KitFastifyErrorHandler } from "@wthek/fastify-middleware";

const fastify = Fastify({ logger: true });

// Pass the handler directly to setErrorHandler
fastify.setErrorHandler(KitFastifyErrorHandler({ log: true }));
```

```Javascript
// Or scope it to a specific plugin
fastify.register(async (instance) => {
    instance.setErrorHandler(
        KitFastifyErrorHandler({ handleUnknownErrors: true })
    );

    instance.get("/scoped", async () => {
        throw new KitHttpError(400, "Bad Request");
    });
});
```

## Options

| Option                | Type                                        | Default | Description                                                                                             |
| --------------------- | ------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `log`                 | `boolean \| ((error, req) => void)`         | `false` | When `true`, logs via Fastify's `request.log.error`. When a function, uses your custom logger callback. |
| `handleUnknownErrors` | `boolean`                                   | `false` | When `true`, returns a structured `{ statusCode: 500, message: "Internal Server Error" }` for non-Kit errors instead of passing them to the default Fastify error handler. |

## How It Works

-   Catches errors thrown in routes and hooks
-   Checks `reply.sent` to avoid `FST_ERR_REP_ALREADY_SENT` crashes
-   Checks if the error is an instance of any `http-error-kit` Errors
-   Formats the error response and sets the correct HTTP status code
-   Passes other errors to the default Fastify error handler (_when `handleUnknownErrors` is disabled_)
-   Returns a structured 500 response for unknown errors (_when `handleUnknownErrors` is enabled_)

## Why Use `@wthek/fastify-middleware`?

-   **No more manual error handling** – Status codes are automatically set.
-   **Consistent API responses** – Standardized errors improve debugging & logging.
-   **Works perfectly with `http-error-kit`** – Fully compatible with existing `http-error-kit` error structures.
-   **Production-safe** – Guards against double-reply crashes and supports structured fallback responses.

## Explore More WTHek Extensions

The WTHek ecosystem continues to grow with new extensions to simplify error handling across various frameworks and libraries. Stay updated with the latest tools that integrate seamlessly with `http-error-kit`.

**Check out the official list of extensions**: [Official Extensions List](https://github.com/Skillnter/http-error-kit/wiki/Official-Extensions-List)

## People

The original author of the project is [Himanshu Bansal][skillnter]

## Donations

**This is all voluntary work**, so if you want to support my efforts you can

-   [Buy Me A Coffee](https://www.buymeacoffee.com/skillnter)
-   [Paypal](https://www.paypal.me/skillnte)
-   [GitHub Sponsor](https://github.com/sponsors/Skillnter)
-   [Patreon](https://www.patreon.com/skillnter)
-   [Open Collective](https://opencollective.com/skillnter)

You can also use the following:

![BTC: bc1p22h4nsad5d8ketyhuvf0vyva6unttxwzzqvkty5r839as0mlclgs72d3mf](https://img.shields.io/badge/BTC-bc1p22h4nsad5d8ketyhuvf0vyva6unttxwzzqvkty5r839as0mlclgs72d3mf-brightgreen)

![ETH: 0x1D59a291391a3CE17C63D5dC50F258Dc0Ab62889](https://img.shields.io/badge/ETH-0x1D59a291391a3CE17C63D5dC50F258Dc0Ab62889-brightgreen)

![BNB: 0x1D59a291391a3CE17C63D5dC50F258Dc0Ab62889](https://img.shields.io/badge/BNB-0x1D59a291391a3CE17C63D5dC50F258Dc0Ab62889-brightgreen)

## License

`@wthek/fastify-middleware` project is open-sourced software licensed under the [MIT license](LICENSE) by [Himanshu Bansal][skillnter].

[skillnter]: https://github.com/Skillnter/
[http-error-kit]: https://www.npmjs.com/package/http-error-kit
