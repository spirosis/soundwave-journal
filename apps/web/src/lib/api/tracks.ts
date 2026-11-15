import { AxiosError } from "axios";
import { apiClient } from "./client";

interface PreviewResponse {
  previewUrl: string;
}

export async function getFreshPreviewUrl(
  deezerTrackId: number,
): Promise<string | null> {
  try {
    const response = await apiClient.get<PreviewResponse>(
      `/tracks/${deezerTrackId}/preview`,
    );
    return response.data.previewUrl;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
