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
  const [player, setPlayer] = useState<PlayerState>({
    track: null,
    isPlaying: false,
    error: null,
  });
  const [progress, setProgress] = useState<ProgressState>({
    currentTime: 0,
    duration: 0,
  });

  const startPlayback = useCallback((audio: HTMLAudioElement) => {
    void audio.play().catch((error: unknown) => {
      // pause()/stop()/changing src while play() is still pending rejects
      // with AbortError: that's a user action, not a playback failure.
      if ((error as { name?: string } | null)?.name === "AbortError") return;
      setPlayer((current) => ({
        ...current,
        isPlaying: false,
        error: PLAYBACK_ERROR,
      }));
    });
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track) return;

    // Restarting a finished preview counts as a new listen.
    if (audio.ended) {
      logEvent({ deezerTrackId: track.id, eventType: "PLAY", source: sourceRef.current });
    }
    startPlayback(audio);
  }, [startPlayback]);

  const play = useCallback(
    (track: PreviewTrack, source: JournalEventSource) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (trackRef.current?.id === track.id) {
        resume();
        return;
      }

      trackRef.current = track;
      sourceRef.current = source;
      // Setting src and calling play() synchronously keeps us inside the
      // user gesture, which Safari/iOS require for playback to start.
      audio.src = track.previewUrl;
      setPlayer({ track, isPlaying: false, error: null });
      setProgress({ currentTime: 0, duration: 0 });
      logEvent({ deezerTrackId: track.id, eventType: "PLAY", source });
      startPlayback(audio);
    },
    [resume, startPlayback],
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
    trackRef.current = null;
    setPlayer({ track: null, isPlaying: false, error: null });
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
          onPlay={() =>
            setPlayer((current) => ({ ...current, isPlaying: true, error: null }))
          }
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
            setPlayer((current) => ({
              ...current,
              isPlaying: false,
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
