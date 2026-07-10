import type { NextFunction, Request, Response } from  "express";
import { isProduction } from "../lib/env.js";

export function errorHandler (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
) {
    if (res.headersSent) {
        next(err);
        return;
    }

    console.error(err);

    const details = err instanceof Error ? err.message : "Unknown error";

    res.status(500).json({
        error: "Internal server error",
        ...(!isProduction ? { details } : {}),
    });
}