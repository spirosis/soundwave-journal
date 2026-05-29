import type { CacheProvider } from "../lib/cache.js";
import { MemoryCacheProvider } from "../lib/cache.js";

interface DeezerArtist {
    id: number;
    name: string;
}

interface DeezerAlbum {
    id: number;
    title: string;
    cover_medium?: string;
    cover_big?: string;
}

interface DeezerTrackResponse {
    id: number;
    title: string;
    duration: number;
    preview: string | null;
    link?: string;
    artist: DeezerArtist;
    album: DeezerAlbum;
}

interface DeezerSearchResponse {
    data: DeezerTrackResponse[];
    total: number;
    next?: string;
}

export interface TrackDto {
    id: number;
    title: string;
    artistName: string;
    albumTitle: string;
    previewUrl: string | null;
    durationSec: number;
    coverUrl: string | null;
    deezerUrl: string | null;
}

export interface SearchTrackResult {
    data: TrackDto[];
    total: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function normalizeTrack(track: DeezerTrackResponse): TrackDto {
    return {
        id: track.id,
        title: track.title,
        artistName: track.artist.name,
        albumTitle: track.album.title,
        previewUrl: track.preview,
        durationSec: track.duration,
        coverUrl: track.album.cover_big ?? track.album.cover_medium ?? null,
        deezerUrl: track.link ?? null,
    };
}

export class DeezerService {
    constructor(
        private readonly cache: CacheProvider,
        private readonly baseUrl = "https://api.deezer.com",
        private readonly ttlMs =  DEFAULT_TTL_MS
    ) {}

    async searchTracks(query: string): Promise<SearchTrackResult>{
        const normalizedQuery = query.trim();

        if(!normalizedQuery){
            throw new Error("SEARCH_QUERY_REQUIRED");
        }

        const cacheKey = `deezer:search:${normalizedQuery.toLowerCase()}`;
        const cached = await this.cache.get<SearchTrackResult>(cacheKey);

        if(cached){
            return cached;
        }

        const url = new URL("/search", this.baseUrl);
        url.searchParams.set("q", normalizedQuery);

        const response = await this.requestJson<DeezerSearchResponse>(url);

        const result: SearchTrackResult = {
            data: response.data.map(normalizeTrack),
            total: response.total,
        };

        await this.cache.set(cacheKey, result, this.ttlMs);
        
        return result;
    }

    async getTrackById(trackId: string | number): Promise<TrackDto | null>{
        const normalizedId = String(trackId).trim();

        if(!normalizedId){
            throw new Error("TRACK_ID_REQUIRED");
        }

        const cacheKey = `deezer:track:${normalizedId}`; 
        const cached = await this.cache.get<TrackDto>(cacheKey);

        if(cached){
            return cached;
        } try {
            const url = new URL(`/track/${normalizedId}`, this.baseUrl);
            const response = await this.requestJson<DeezerTrackResponse>(url);
            const track = normalizeTrack(response);

            await this.cache.set(cacheKey, track, this.ttlMs);

            return track;
        } catch (error) {
            if (error instanceof Error && error.message === "DEEZER_NOT_FOUND") {
                return null;
            }
            throw error;
        }
    }

    private async requestJson<T>(url: URL): Promise<T> {
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
            },
        });

        if(!response.ok) {
            if(response.status === 404) {
                throw new Error("DEEZER_NOT_FOUND");        
            }

            throw new Error(`DEEZER_REQUEST_FAILED:${response.status}`);
        }

        return (await response.json()) as T;
    }
}

export const deezerService = new DeezerService(new MemoryCacheProvider());