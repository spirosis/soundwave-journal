"use client";

import Image from "next/image";
import { Pause, Play, X } from "lucide-react";
import { formatDuration } from "../../lib/format";
import { usePreviewPlayer, usePreviewProgress } from "./preview-player";
import styles from "./now-playing-bar.module.css";

const SCRUB_STEPS = 1000;

export function NowPlayingBar() {
  const player = usePreviewPlayer();
  const { currentTime, duration } = usePreviewProgress();
  const track = player.track;

  if (!track) {
    return null;
  }

  const scrubValue =
    duration > 0 ? Math.round((currentTime / duration) * SCRUB_STEPS) : 0;

  return (
    <div className={styles.bar} role="region" aria-label="Now playing">
      <div className={`${styles.thumb} ${player.isPlaying ? styles.playing : ""}`}>
        {track.coverUrl ? (
          <Image
            src={track.coverUrl}
            alt=""
            width={48}
            height={48}
            className={styles.thumbImage}
            unoptimized
          />
        ) : null}
      </div>

      <div className={styles.meta}>
        <p className={styles.title}>{track.title}</p>
        <p className={styles.artist}>{track.artistName}</p>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.playButton}
          onClick={() => (player.isPlaying ? player.pause() : player.resume())}
          aria-label={player.isPlaying ? "Pause preview" : "Play preview"}
        >
          {player.isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <span className={styles.time}>{formatDuration(currentTime)}</span>
        <input
          type="range"
          className={styles.scrub}
          min={0}
          max={SCRUB_STEPS}
          value={scrubValue}
          onChange={(event) =>
            player.seek(Number(event.target.value) / SCRUB_STEPS)
          }
          aria-label="Preview position"
          disabled={duration === 0}
        />
        <span className={styles.time}>{formatDuration(duration)}</span>
      </div>

      {player.error ? <p className={styles.error}>{player.error}</p> : null}

      <button
        type="button"
        className={styles.closeButton}
        onClick={player.stop}
        aria-label="Close player"
      >
        <X size={16} />
      </button>
    </div>
  );
}
