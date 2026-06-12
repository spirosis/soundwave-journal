import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function getAccessSecret(): string {
    const secret = process.env["JWT_ACCESS_SECRET"];

    if(!secret) {
        throw new Error("Missing env var: JWT_ACCESS_SECRET");
    }

    return secret;
}

interface TokenPayload extends jwt.JwtPayload {
    sub: string;
    type: "access" |  "refresh";
}

export function requiresAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.slice(7);

  let accessSecret: string;

  try {
    accessSecret = getAccessSecret();
  } catch {
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  try {
    const payload = jwt.verify(token, accessSecret) as TokenPayload;

    if (payload.type !== "access" || !payload.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.locals["userId"] = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}




