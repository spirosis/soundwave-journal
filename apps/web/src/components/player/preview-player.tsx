"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  logTrackEvent,
  type JournalEventSource,
  type LogTrackEventPayload,
} from "../../lib/api/journal";
import { getFreshPreviewUrl } from "../../lib/api/tracks";
import { isPreviewUrlStale } from "../../lib/preview-url";

export interface PreviewTrack {
  id: number;
  title: string;
  artistName: string;
  coverUrl: string | null;
  previewUrl: string;
}

interface PlayerState {
  track: PreviewTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ProgressState {
  currentTime: number;
  duration: number;
}

interface PreviewPlayerApi extends PlayerState {
  play: (track: PreviewTrack, source: JournalEventSource) => void;
  pause: () => void;
  resume: () => void;
  toggle: (track: PreviewTrack, source: JournalEventSource) => void;
  seek: (fraction: number) => void;
  stop: () => void;
}

const PLAYBACK_ERROR = "This preview could not be played.";
const GESTURE_ERROR = "Tap play again to start the preview.";
const UNAVAILABLE_ERROR = "This preview is no longer available.";

// Progress changes ~4x per second while playing; it lives in its own context
// so only the active cover and the now-playing bar re-render for it.
const PlayerContext = createContext<PreviewPlayerApi | null>(null);
const ProgressContext = createContext<ProgressState>({
  currentTime: 0,
  duration: 0,
});

function logEvent(payload: LogTrackEventPayload): void {
  void logTrackEvent(payload).catch(() => {
    // Telemetry failures shouldn't disrupt playback.
  });
}

export function PreviewPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<PreviewTrack | null>(null);
  const sourceRef = useRef<JournalEventSource>("search");
  // Set when a listen starts (new track, or restart after `ended`) and
  // consumed by onPlay, so PLAY is only logged once audio actually starts.
  const pendingPlayLogRef = useRef(false);
  const requestIdRef = useRef(0);
  const [player, setPlayer] = useState<PlayerState>({
    track: null,
    isPlaying: false,
    isLoading: false,
    error: null,
  });
  const [progress, setProgress] = useState<ProgressState>({
    currentTime: 0,
    duration: 0,
  });

  const startPlayback = useCallback((audio: HTMLAudioElement) => {
    void audio.play().catch((error: unknown) => {
      const name = (error as { name?: string } | null)?.name;
      // pause()/stop()/changing src while play() is pending rejects with
      // AbortError: that's a user action, not a playback failure.
      if (name === "AbortError") return;
      setPlayer((current) => ({
        ...current,
        isPlaying: false,
        isLoading: false,
        // Browsers only allow play() shortly after a user gesture; a preview
        // refresh can occasionally outlast that window.
        error: name === "NotAllowedError" ? GESTURE_ERROR : PLAYBACK_ERROR,
      }));
    });
  }, []);

  // Loads `track` into the element (refreshing an expired preview URL first)
  // and starts it. Deezer preview tokens expire within minutes, so stored
  // URLs are often stale by the time someone presses play.
  const loadAndPlay = useCallback(
    (track: PreviewTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      pendingPlayLogRef.current = true;

      if (!isPreviewUrlStale(track.previewUrl)) {
        // Synchronous src + play() keeps us inside the user gesture (Safari/iOS).
        audio.src = track.previewUrl;
        startPlayback(audio);
        return;
      }

      const requestId = ++requestIdRef.current;
      setPlayer((current) => ({ ...current, isLoading: true }));

      void getFreshPreviewUrl(track.id)
        .then((previewUrl) => {
          if (requestId !== requestIdRef.current || trackRef.current?.id !== track.id) {
            return;
          }
          if (!previewUrl) {
            pendingPlayLogRef.current = false;
            setPlayer((current) => ({
              ...current,
              isLoading: false,
              error: UNAVAILABLE_ERROR,
            }));
            return;
          }
          trackRef.current = { ...track, previewUrl };
          audio.src = previewUrl;
          setPlayer((current) => ({ ...current, isLoading: false }));
          startPlayback(audio);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          pendingPlayLogRef.current = false;
          setPlayer((current) => ({
            ...current,
            isLoading: false,
            error: PLAYBACK_ERROR,
          }));
        });
    },
    [startPlayback],
  );

  const resume = useCallback(() => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track) return;

    if (audio.ended) {
      loadAndPlay(track);
      return;
    }

    startPlayback(audio);
  }, [loadAndPlay, startPlayback]);

  const play = useCallback(
    (track: PreviewTrack, source: JournalEventSource) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (trackRef.current?.id === track.id) {
        // Resuming a paused preview keeps its original source; restarting a
        // finished one from a surface is a new listen attributed to that surface.
        if (audio.ended) {
          sourceRef.current = source;
        }
        resume();
        return;
      }

      trackRef.current = track;
      sourceRef.current = source;
      setPlayer({ track, isPlaying: false, isLoading: false, error: null });
      setProgress({ currentTime: 0, duration: 0 });
      loadAndPlay(track);
    },
    [loadAndPlay, resume],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(
    (track: PreviewTrack, source: JournalEventSource) => {
      const audio = audioRef.current;
      if (trackRef.current?.id === track.id && audio && !audio.paused) {
        pause();
      } else {
        play(track, source);
      }
    },
    [pause, play],
  );

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(Math.max(fraction, 0), 1) * audio.duration;
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    requestIdRef.current += 1;
    pendingPlayLogRef.current = false;
    trackRef.current = null;
    setPlayer({ track: null, isPlaying: false, isLoading: false, error: null });
    setProgress({ currentTime: 0, duration: 0 });
  }, []);

  const api = useMemo<PreviewPlayerApi>(
    () => ({ ...player, play, pause, resume, toggle, seek, stop }),
    [player, play, pause, resume, toggle, seek, stop],
  );

  return (
    <PlayerContext.Provider value={api}>
      <ProgressContext.Provider value={progress}>
        {children}
        <audio
          ref={audioRef}
          preload="none"
          hidden
          onPlay={() => {
            const track = trackRef.current;
            if (pendingPlayLogRef.current && track) {
              pendingPlayLogRef.current = false;
              logEvent({ deezerTrackId: track.id, eventType: "PLAY", source: sourceRef.current });
            }
            setPlayer((current) => ({
              ...current,
              isPlaying: true,
              isLoading: false,
              error: null,
            }));
          }}
          onPause={() =>
            setPlayer((current) => ({ ...current, isPlaying: false }))
          }
          onTimeUpdate={(event) => {
            const audio = event.currentTarget;
            setProgress({
              currentTime: audio.currentTime,
              duration: Number.isFinite(audio.duration) ? audio.duration : 0,
            });
          }}
          onLoadedMetadata={(event) => {
            const audio = event.currentTarget;
            setProgress((current) => ({
              ...current,
              duration: Number.isFinite(audio.duration) ? audio.duration : 0,
            }));
          }}
          onEnded={() => {
            const track = trackRef.current;
            if (track) {
              logEvent({
                deezerTrackId: track.id,
                eventType: "COMPLETE",
                source: sourceRef.current,
                completionPct: 100,
              });
            }
            setPlayer((current) => ({ ...current, isPlaying: false }));
          }}
          onError={() => {
            if (!trackRef.current) return;
            pendingPlayLogRef.current = false;
            setPlayer((current) => ({
              ...current,
              isPlaying: false,
              isLoading: false,
              error: PLAYBACK_ERROR,
            }));
          }}
        />
      </ProgressContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePreviewPlayer(): PreviewPlayerApi {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePreviewPlayer must be used within PreviewPlayerProvider");
  }
  return context;
}

export function usePreviewProgress(): ProgressState {
  return useContext(ProgressContext);
}
