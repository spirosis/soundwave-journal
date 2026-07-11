import { Router } from "express";
import type { Request, Response } from "express";
import { requiresAuth } from "../middleware/auth.middleware.js";
import { getRateLimitStatusForSubject } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.get(
    "/rate-limit/status",
    requiresAuth,
    async(req: Request, res: Response)=>{
        const snapshot = getRateLimitStatusForSubject(req.ip ?? "unknown");

        res.json({
            subject: {
                type: "ip",
                id: req.ip,
            },
            ...snapshot,
        });
    }
);

export default router;
