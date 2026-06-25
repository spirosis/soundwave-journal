import { Router } from "express";
import type { Request, Response } from "express";
import { deezerService } from "../services/deezer.service.js";
import { publicLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.get("/discovery/genres", publicLimiter, async (_req: Request, res: Response)=>{
    try {
        const genres = await deezerService.getGenres();
        res.json({ data: genres });

    } catch (error){
        if (
            error instanceof Error &&
            error.message.startsWith("DEEZER_REQUEST_FAILED:")
        ){
            res.status(502).json({ error: "Failed to fetch data from Deezer" });
            return;
        }

        throw error;
    }
});

export default router;