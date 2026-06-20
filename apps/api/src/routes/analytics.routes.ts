import { Router } from "express";
import type { Request, Response } from "express";
import { getUserId } from "../lib/route-helpers.js";
import { requiresAuth } from "../middleware/auth.middleware.js";
import { analyticsService } from "../services/analytics.service.js";

const router =  Router();

router.get("/analytics/weekly", requiresAuth, async(_req: Request, res: Response)=>{
    const userId = getUserId(res);
    const analytics = await analyticsService.getWeeklyAnalytics(userId);
    res.json(analytics);
});

export default router;