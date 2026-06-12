import { Router } from "express";
import type { Request, Response } from "express";
import { requiresAuth } from "../middleware/auth.middleware.js";
import { favoritesService } from "../services/favorites.service.js";
import { getUserId } from "../lib/route-helpers.js";

const router = Router();

router.get("/favorites", requiresAuth, async (_req: Request, res: Response) => {
  const userId = getUserId(res);
  const favorites = await favoritesService.getFavorites(userId);
  res.json(favorites);
});

router.post("/favorites", requiresAuth, async (req: Request, res: Response) => {
  const userId = getUserId(res);
  const { deezerTrackId, trackTitle, artistName, albumCoverUrl, previewUrl, genre } =
    req.body as Record<string, unknown>;
    
  const normalizedTrackTitle = typeof trackTitle === "string" ? trackTitle.trim() : "";
  const normalizedArtistName = typeof artistName === "string" ? artistName.trim() : "";

  if (
    typeof deezerTrackId !== "number" ||
    !Number.isInteger(deezerTrackId) ||
    deezerTrackId <= 0 ||
    typeof trackTitle !== "string" ||
    !normalizedTrackTitle ||
    typeof artistName !== "string" ||
    !normalizedArtistName
  ) {
    res.status(400).json({ error: "deezerTrackId, trackTitle and artistName are required" });
    return;
  }

  const favorite = await favoritesService.addFavorite(userId, {
    deezerTrackId: deezerTrackId as number,
    trackTitle: normalizedTrackTitle,
    artistName: normalizedArtistName,
    ...(typeof albumCoverUrl === "string" && albumCoverUrl.trim()
      ? { albumCoverUrl: albumCoverUrl.trim() }
      : {}),
    ...(typeof previewUrl === "string" && previewUrl.trim()
      ? { previewUrl: previewUrl.trim() }
      : {}),
    ...(typeof genre === "string" && genre.trim()
      ? { genre: genre.trim() }
      : {}),
  });

  res.json(favorite);
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
