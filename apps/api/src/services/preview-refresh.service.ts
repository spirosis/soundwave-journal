import { prisma } from "../lib/prisma.js";
import { isPreviewUrlStale } from "../lib/preview-url.js";
import { deezerService } from "./deezer.service.js";

export class PreviewRefreshService {
  /**
   * Returns a preview URL that is still valid for this track, consulting
   * Deezer only when the stored copy has expired. Fresh values are persisted
   * to the user's metadata, favorites and playlist tracks so later listings
   * start from the newest URL seen.
   */
  async getFreshPreviewUrl(
    userId: string,
    deezerTrackId: number,
  ): Promise<string | null> {
    const deezerTrackIdBig = BigInt(deezerTrackId);

    const metadata = await prisma.trackMetadata.findUnique({
      where: { userId_deezerTrackId: { userId, deezerTrackId: deezerTrackIdBig } },
      select: { previewUrl: true },
    });

    let previewUrl: string | null = null;

    if (metadata?.previewUrl && !isPreviewUrlStale(metadata.previewUrl)) {
      previewUrl = metadata.previewUrl;
    } else {
      const track = await deezerService.getTrackById(deezerTrackId);
      previewUrl = track?.previewUrl ?? null;
    }

    if (!previewUrl || isPreviewUrlStale(previewUrl)) {
      return null;
    }

    // Favorites and playlist rows hold their own copy; bring them along even
    // when the metadata copy was already fresh.
    await Promise.all([
      prisma.trackMetadata.updateMany({
        where: { userId, deezerTrackId: deezerTrackIdBig },
        data: { previewUrl },
      }),
      prisma.favorite.updateMany({
        where: { userId, deezerTrackId: deezerTrackIdBig },
        data: { previewUrl },
      }),
      prisma.playlistTrack.updateMany({
        where: { deezerTrackId: deezerTrackIdBig, playlist: { userId } },
        data: { previewUrl },
      }),
    ]);

    return previewUrl;
  }
}

export const previewRefreshService = new PreviewRefreshService();
