import type { Response } from "express";

export function getUserId(res:Response): string {
    const userId = res.locals["userId"];
    
    if(typeof userId !== "string" || !userId.trim()) {
        throw new Error("MISSING_AUTH_USER");
    }

    return userId;
}