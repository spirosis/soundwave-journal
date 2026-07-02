import { Router } from "express";
import type { Request, Response } from "express";
import { requiresAuth } from "../middleware/auth.middleware.js";
import { playlistsService } from "../services/playlists.service.js";
import { getUserId } from "../lib/route-helpers.js";

const router = Router();



router.get("/playlists", requiresAuth, async (_req: Request, res: Response) => {
    const userId = getUserId(res);
    const playlists = await playlistsService.getPlaylists(userId);
    res.json(playlists);
});

router.post("/playlists", requiresAuth, async ( req: Request, res: Response) => {
    const userId = getUserId(res);
    const { name, isPublic } = req.body as Record<string, unknown>;

    const normalizedName = typeof name == "string" ? name.trim() : "";

    if(!normalizedName){
        res.status(400).json({ error: "Playlist name is required"});
        return;
    }

    if(typeof isPublic !== "undefined" && typeof isPublic !== "boolean") {
        res.status(400).json({ error: "isPublic must be a boolean"});
        return;
    }

    const playlist = await playlistsService.createPlaylist(userId,  {
        name: normalizedName,
        ...(typeof isPublic === "boolean" ? { isPublic } : {}),
    });

    res.status(201).json(playlist);
});

router.get("/playlists/:id", requiresAuth, async(req: Request, res: Response) =>{
    const userId = getUserId(res);
    const playlistId = req.params.id;
    
    if(typeof playlistId !== "string" || !playlistId.trim()) {
        res.status(400).json({ error: "Playlist id is required"});
        return;
    }

    const playlist = await playlistsService.getPlaylistById(userId, playlistId);

    if(!playlist){
        res.status(404).json({ error: "Playlist not found"});
        return;
    }

    res.json(playlist);
});

router.get("/playlists/:id/tracks", requiresAuth, async (req: Request, res: Response) => {
    const userId = getUserId(res);
    const playlistId = req.params.id;

    if (typeof playlistId !== "string" || !playlistId.trim()) {
        res.status(400).json({ error: "Playlist id is required" });
        return;
    }

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

    try {
        const tracks = await playlistsService.getPlaylistTracks(userId, playlistId, page, limit);
        res.json(tracks);
    } catch (error) {
        if (error instanceof Error && error.message === "PLAYLIST_NOT_FOUND") {
            res.status(404).json({ error: "Playlist not found" });
            return;
        }

        throw error;
    }
});

router.post("/playlists/:id/tracks", requiresAuth, async (req: Request, res: Response) =>{
    const userId = getUserId(res);
    const playlistId = req.params.id;

    if (typeof playlistId !== "string" || !playlistId.trim()){
        res.status(400).json({ error: "Playlist id is required"});
        return;
    }

    const {deezerTrackId, trackTitle, artistName, albumCoverUrl, previewUrl, durationSec } = req.body as Record<string, unknown>;

    const normalizedTrackTitle =  typeof trackTitle === "string" ? trackTitle.trim() : "";
    const normalizedArtistName = typeof artistName === "string" ? artistName.trim() : "";

    if (
        typeof deezerTrackId !== "number" || !Number.isInteger(deezerTrackId) || deezerTrackId <= 0 || !normalizedTrackTitle || !normalizedArtistName
    ) {
        res.status(400).json({
            error: "deezerTrackId, trackTitle and artistName are required",
        });
        return
    }
    
    if (
        typeof durationSec !== "undefined" && (typeof durationSec !== "number" || !Number.isInteger(durationSec) || durationSec <= 0)
    ){
        res.status(400).json({ error: "durationSec must be a positive integer"});
        return;
    } try {
        const track = await playlistsService.addTrackToPlaylist(userId, playlistId, {
      deezerTrackId,
      trackTitle: normalizedTrackTitle,
      artistName: normalizedArtistName,
      ...(typeof albumCoverUrl === "string" && albumCoverUrl.trim()
        ? { albumCoverUrl: albumCoverUrl.trim() }
        : {}),
      ...(typeof previewUrl === "string" && previewUrl.trim()
        ? { previewUrl: previewUrl.trim() }
        : {}),
      ...(typeof durationSec === "number" ? { durationSec } : {}),
    });

    res.status(201).json(track);
    } catch (error) {
        if (error instanceof Error && error.message === "PLAYLIST_NOT_FOUND"){
            res.status(404).json({ error: "Playlist not found" });
            return;
        }
        if (error instanceof Error && error.message === "TRACK_ALREADY_IN_PLAYLIST"){
            res.status(409).json({ error: "Track already exists in playlist" });
            return;
        }
        throw error;
    }
});

router.patch("/playlists/:id/tracks/reorder", requiresAuth, async (req: Request, res: Response) => {
    const userId = getUserId(res);
    const playlistId = req.params.id;
    const { trackIds } = req.body as Record<string, unknown>;

    if (typeof playlistId !== "string" || !playlistId.trim()) {
        res.status(400).json({ error: "Playlist id is required" });
        return;
    }

    if (
        !Array.isArray(trackIds) ||
        trackIds.length === 0 ||
        trackIds.some((id) => typeof id !== "number" || !Number.isInteger(id) || id <= 0)
    ) {
        res.status(400).json({ error: "trackIds must be a non-empty array of positive integers" });
        return;
    }

    try {
        await playlistsService.reorderTracks(userId, playlistId, trackIds as number[]);
        res.status(200).send();
    } catch (error) {
        if (error instanceof Error && error.message === "PLAYLIST_NOT_FOUND") {
            res.status(404).json({ error: "Playlist not found" });
            return;
        }
        if (error instanceof Error && error.message === "REORDER_ID_MISMATCH") {
            res.status(400).json({ error: "trackIds must match all tracks in the playlist exactly" });
            return;
        }
        throw error;
    }
});

router.delete("/playlists/:id/tracks/:trackId", requiresAuth, async (req: Request, res: Response)=>{
    const userId = getUserId(res);
    const playlistId = req.params.id;
    const deezerTrackId = Number(req.params.trackId);

    if(typeof playlistId !== "string" || !playlistId.trim()){
        res.status(400).json({ error: "Playlist id is required"});
        return;
    }

    if(!Number.isInteger(deezerTrackId) || deezerTrackId <= 0){
        res.status(400).json({ error: "Invalid trackId"});
        return;
    } try {
        const removed = await playlistsService.removeTrackFromPlaylist(
            userId,
            playlistId,
            deezerTrackId,
        );

        if(!removed){
            res.status(404).json({ error: "Track not found in playlist"});
            return;
        }

        res.status(204).send();
    } catch (error) {
        if(error instanceof Error && error.message === "PLAYLIST_NOT_FOUND"){
            res.status(404).json({ error: "Playlist not found"});
            return;
        }
        throw error;
    }
});

export default router;