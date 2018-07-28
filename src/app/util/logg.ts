/*
 * Copyright (c) 2018 Richard L. McNeary II
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


export default {

    /**
     * Add the "logg" parameter to the URL or localStorage to enable logging.
     */
    debug(callback: CreateMessage, category?: string) {
        if (!isLoggingEnabled()) {
            return;
        }

        logMessage(
            console.log,
            "[D]",
            "color: #7E7E7E;",
            callback(),
            category
        );
    },

    /**
     * Add the "logg" parameter to the URL or localStorage to enable logging.
     * @param callback This can return an Error object. The Error.message will
     * be printed. If Error.name exists it will be prefixed to the message.
     */
    error(callback: CreateErrorMessage, category?: string) {
        if (!isLoggingEnabled()) {
            return;
        }

        logMessage(
            console.error,
            "[E]",
            null,
            callback(),
            category
        );
    },

    /**
     * Add the "logg" parameter to the URL or localStorage to enable logging.
     */
    info(callback: CreateMessage, category?: string) {
        if (!isLoggingEnabled()) {
            return;
        }

        logMessage(
            console.log,
            "[I]",
            null,
            callback(),
            category
        );
    },

    /**
     * Add the "logg" parameter to the URL or localStorage to enable logging.
     */
    warn(callback: CreateMessage, category?: string) {
        if (!isLoggingEnabled()) {
            return;
        }

        logMessage(
            console.warn,
            "[W]",
            null,
            callback(),
            category
        );
    }

};


function isLoggingEnabled(): boolean {
    if (!self.localStorage) {
        // In worker context, there is no access to localStorage. For now return
        // true.
        return true;
    }

    // If you don't want to worry about adding the parameter to the URL add a
    // "logg" entry to localStorage.
    if (Object.keys(localStorage).includes("logg")) {
        return true;
    }

    // If not in localStorage check the URL for the "logg" parameter.
    const query = (new URL(window.location.href)).searchParams;
    return query.has("logg");
}

function logMessage(logFunc: (...args) => void, prefix: string, format: string, message: CreateErrorMessageResult, category: string) {
    let args = [];
    const cat = createCategory(category);
    if (typeof message === "string") {
        args.push(`%c${prefix}${cat}${message}`);
    } else if (message instanceof Error) {
        args.push(`%c${prefix}${cat}${message.name && message.name !== "Error" ? message.name + "-" : ""}${message.message}`);
    } else if (Array.isArray(message) && message.length) {
        args.push(`%c${prefix}${cat}${message[0]}`);
        args = [...args, ...message.slice(1)];
    }

    args.splice(1, 0, format || "");

    (logFunc || console.log)(...args);
}

function createCategory(category: string): string {
    return category ? `[${category}] ` : " ";
}

export type CreateMessage = () => CreateMessageResult;

export type CreateErrorMessage = () => CreateErrorMessageResult;

export type CreateMessageResult = string | any[];

export type CreateErrorMessageResult = CreateMessageResult | Error;
