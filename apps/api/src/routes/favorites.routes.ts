import { Router } from "express";
import type { Request, Response } from "express";
import { requiresAuth } from "../middleware/auth.middleware.js";
import { favoritesService } from "../services/favorites.service.js";
import { getUserId } from "../lib/route-helpers.js";

const router = Router();

router.get("/favorites", requiresAuth, async (req: Request, res: Response) => {
  const userId = getUserId(res);

  const pageParam = req.query.page;
  const limitParam = req.query.limit;

  const page =
    typeof pageParam === "string" && Number.isInteger(Number(pageParam)) && Number(pageParam) > 0
      ? Number(pageParam)
      : 1;

  const limit =
    typeof limitParam === "string" && Number.isInteger(Number(limitParam)) && Number(limitParam) > 0
      ? Math.min(Number(limitParam), 50)
      : 20;

  const favorites = await favoritesService.getFavorites(userId, page, limit);
  res.json(favorites);
});

router.post("/favorites", requiresAuth, async (req: Request, res: Response) => {
  const userId = getUserId(res);
  const { deezerTrackId, genre } = req.body as Record<string, unknown>;

  if (
    typeof deezerTrackId !== "number" ||
    !Number.isInteger(deezerTrackId) ||
    deezerTrackId <= 0
  ) {
    res.status(400).json({ error: "deezerTrackId is required" });
    return;
  }

  try {
    const favorite = await favoritesService.addFavorite(userId, {
      deezerTrackId,
      ...(typeof genre === "string" && genre.trim()
        ? { genre: genre.trim() }
        : {}),
    });

    res.json(favorite);
  } catch (error) {
    if (error instanceof Error && error.message === "TRACK_NOT_FOUND") {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    throw error;
  }
});

router.delete("/favorites/:trackId", requiresAuth, async (req: Request, res: Response) => {
  const userId = getUserId(res);
  const deezerTrackId = Number(req.params["trackId"]);

  
  if (!Number.isInteger(deezerTrackId) || deezerTrackId <= 0) {
    res.status(400).json({ error: "Invalid trackId" });
    return;
  }

  const removed = await favoritesService.removeFavorite(userId, deezerTrackId);

  if (!removed) {
    res.status(404).json({ error: "Favorite not found" });
    return;
  }

  res.status(204).send();
});

export default router;
