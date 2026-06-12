import { Router } from "express";
import type { Response, Request } from "express";
import { requiresAuth } from "../middleware/auth.middleware.js";
import { recommendationService } from "../services/recommendations.service.js";
import { getUserId } from "../lib/route-helpers.js";

const router = Router();

router.get("/recommendations", requiresAuth, async (_req: Request, res: Response)=> {
    const userId = getUserId(res);
    const recommendations = await recommendationService.getTopGenres(userId);
    res.json({ recommendations });
});

router.get("/recommendations/metrics", requiresAuth, async(_req: Request, res: Response)=>{
    const userId = getUserId(res);
    const metrics = await recommendationService.getRecommendationMetrics(userId);
    res.json(metrics);
});

export default router;

