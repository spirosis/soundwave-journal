import { Router } from "express";
import type { Request, Response } from "express";
import { requiresAuth } from "../middleware/auth.middleware.js";
import { previewRefreshService } from "../services/preview-refresh.service.js";
import { getUserId } from "../lib/route-helpers.js";

const router = Router();

// Deezer preview URLs are signed and expire within minutes. The browser asks
// for a fresh one right before play() when the copy it holds is stale.
router.get("/tracks/:trackId/preview", requiresAuth, async (req: Request, res: Response) => {
  const userId = getUserId(res);
  const deezerTrackId = Number(req.params.trackId);

  if (!Number.isInteger(deezerTrackId) || deezerTrackId <= 0) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }

  try {
    const previewUrl = await previewRefreshService.getFreshPreviewUrl(userId, deezerTrackId);

    if (!previewUrl) {
      res.status(404).json({ error: "No preview available for this track" });
      return;
    }

    res.json({ previewUrl });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not refresh preview" });
  }
});

export default router;
