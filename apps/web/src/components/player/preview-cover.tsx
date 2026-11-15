"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import type { JournalEventSource } from "../../lib/api/journal";
import {
  usePreviewPlayer,
  usePreviewProgress,
  type PreviewTrack,
} from "./preview-player";
import styles from "./preview-cover.module.css";

interface PreviewCoverProps {
  track: Omit<PreviewTrack, "previewUrl"> & { previewUrl: string | null };
  source: JournalEventSource;
  size?: number;
}

const RING_RADIUS = 46;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// Mounted only on the active cover, so progress updates re-render one ring.
function ProgressRing() {
  const { currentTime, duration } = usePreviewProgress();
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <svg
      className={styles.ring}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.ringTrack} cx="50" cy="50" r={RING_RADIUS} />
      <circle
        className={styles.ringProgress}
        cx="50"
        cy="50"
        r={RING_RADIUS}
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - progress)}
      />
    </svg>
  );
}

export function PreviewCover({ track, source, size = 72 }: PreviewCoverProps) {
  const player = usePreviewPlayer();
  const isActive = player.track?.id === track.id;
  const isPlaying = isActive && player.isPlaying;

  return (
    <div
      className={`${styles.cover} ${isActive ? styles.active : ""} ${isPlaying ? styles.playing : ""}`}
      style={{ width: size, height: size }}
    >
      {track.coverUrl ? (
        <Image
          src={track.coverUrl}
          alt=""
          width={size}
          height={size}
          className={styles.image}
          unoptimized
        />
      ) : (
        <div className={styles.placeholder} aria-hidden="true" />
      )}

      {isActive ? <ProgressRing /> : null}

      {track.previewUrl ? (
        <button
          type="button"
          className={styles.button}
          onClick={() =>
            player.toggle(
              { ...track, previewUrl: track.previewUrl as string },
              source,
            )
          }
          aria-label={
            isPlaying
              ? `Pause preview: ${track.title}`
              : `Play preview: ${track.title}`
          }
          aria-pressed={isPlaying}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
      ) : null}
    </div>
  );
}
