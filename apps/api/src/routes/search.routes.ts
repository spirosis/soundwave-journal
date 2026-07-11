import { Router } from "express";
import type { Request, Response } from "express";
import { deezerService } from "../services/deezer.service.js";
import {
  publicDiagnostics,
  publicLimiter,
} from "../middleware/rate-limit.middleware.js";

const router = Router();

router.get("/search", publicDiagnostics, publicLimiter, async (req: Request, res: Response) =>{
    const q = req.query["q"];

    if(typeof q !== "string" || !q.trim()){
        res.status(400).json({ error: "Query parameter is required" });
        return;
    } try {
        const result = await deezerService.searchTracks(q);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "SEARCH_QUERY_REQUIRED"){
            res.status(400).json({ error:"Query parameter q is required"});
            return;
        }
        if ( error instanceof Error && error.message === "DEEZER_TIMEOUT"){
            res.status(502).json({ error: "Deezer request timed out"});
            return;
        }
        if(
            error instanceof Error && error.message.startsWith("DEEZER_REQUEST_FAILED:")
        ){
            res.status(502).json({ error: "Failed to fetch data from Deezer"});
            return;
        }

        throw error;
    }
});

router.get("/tracks/:id", publicLimiter, async (req: Request, res: Response) => {
    const id  = req.params.id;

    if (typeof id !== "string" || !id.trim()) {
        res.status(400).json( { error: "Track id is required"});
        return;
    } try {
        const track = await deezerService.getTrackById(id);
        
        if(!track){
            res.status(404).json({ error: "Track not found"});
            return;
        }
        res.json(track);
    } catch (error) {
        if (error instanceof Error && error.message === "TRACK_ID_REQUIRED"){
            res.status(400).json({ error: "Track id is required" });
            return;
        }

        if(error instanceof Error && error.message === "DEEZER_TIMEOUT"){
            res.status(502).json({ error: "Deezer request timed out"});
            return;
        }
        if(
            error instanceof Error &&
            error.message.startsWith("DEEZER_REQUEST_FAILED")
        ) {
            res.status(502).json({ error: "Failed to fetch data from Deezer" });
            return;
        }
        
        throw error;
    } 
});


export default router;



