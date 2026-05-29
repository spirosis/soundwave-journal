import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env["JWT_ACCESS_SECRET"] ?? "";

interface TokenPayload extends jwt.JwtPayload {
    sub: string;
    type: "access" |  "refresh";
}

export function requiresAuth( req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if(!header?.startsWith("Bearer ")){
        res.status(401).json({ error: "Unauthorized"});
        return;
    }
    const token = header.slice(7);

    try {
        const payload = jwt.verify(token, ACCESS_SECRET) as TokenPayload;

        if (payload.type !== "access" || !payload.sub) {
            res.status(401).json({ error: "Unauthorized"});
            return;
        }

        res.locals["userId"] = payload.sub;
        next();
    } catch {
        res.status(401).json({ error: "Unauthorized"});
    }
}




