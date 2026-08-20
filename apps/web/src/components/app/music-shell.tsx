"use client";

import Link from "next/link";
import {
  Search,
  Radio,
  UserRound,
  Home,
  BookOpen,
  Library,
  Compass,
  ListMusic,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  MoreHorizontal,
  Heart,
} from "lucide-react";

import styles from "./music-shell.module.css";

export type MusicShellActiveNav =
  | "home"
  | "search"
  | "journal"
  | "library"
  | "explore";

interface NavItem {
  key: MusicShellActiveNav;
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const navItems: NavItem[] = [
  { key: "home", href: "/", label: "Home", icon: Home },
  { key: "search", href: "/search", label: "Search", icon: Search },
  { key: "journal", href: "/journal", label: "Journal", icon: BookOpen },
  { key: "library", href: "/library", label: "Library", icon: Library },
  { key: "explore", href: "/discovery", label: "Explore", icon: Compass },
];

interface MusicShellProps {
  active: MusicShellActiveNav;
  children: React.ReactNode;
}

export function MusicShell({ active, children }: MusicShellProps) {
  return (
    <div className={styles.app}>
      {/* SIDEBAR */}

      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <span>Music Journal</span>
        </div>

        <nav className={styles.navigation}>
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={item.key === active ? styles.activeNav : undefined}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}

          <Link href="/library">
            <ListMusic size={18} />
            Playlists
          </Link>
        </nav>

        <div className={styles.sidebarDivider} />

        <p className={styles.sidebarLabel}>YOUR PLAYLISTS</p>

        <div className={styles.sidebarPlaylists}>
          <button>
            <strong>High Distortion</strong>
            <span>45 songs · 95 min</span>
          </button>

          <button>
            <strong>Easy Breezy Beats</strong>
            <span>23 songs · 40 min</span>
          </button>

          <button>
            <strong>Mellow Moments</strong>
            <span>45 songs · 95 min</span>
          </button>
        </div>

        <button className={styles.newPlaylist}>+ New Playlist</button>
      </aside>

      {/* MAIN */}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <label className={styles.search}>
            <Search size={17} />
            <input
              type="search"
              placeholder="Search songs, artists, albums or moods"
            />
          </label>

          <div className={styles.topActions}>
            <button aria-label="Devices">
              <Radio size={19} />
            </button>

            <button className={styles.avatar} aria-label="Profile">
              <UserRound size={18} />
            </button>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>

      {/* PLAYER */}

      <footer className={styles.player}>
        <div className={styles.nowPlaying}>
          <div className={styles.playerCover}>
            <img src="/images/player/current-track.svg" alt="Current track" />
          </div>

          <div>
            <strong>The Emptiness Machine</strong>
            <span>Linkin Park · 2024</span>
          </div>

          <button className={styles.iconButton}>
            <Heart size={17} />
          </button>
        </div>

        <div className={styles.playerCenter}>
          <div className={styles.playerControls}>
            <button>
              <SkipBack size={17} fill="currentColor" />
            </button>

            <button className={styles.playMain}>
              <Play size={17} fill="currentColor" />
            </button>

            <button>
              <SkipForward size={17} fill="currentColor" />
            </button>
          </div>

          <div className={styles.progressRow}>
            <span>00:58</span>

            <div className={styles.progress}>
              <div className={styles.progressPlayed} />
            </div>

            <span>03:11</span>
          </div>
        </div>

        <div className={styles.playerRight}>
          <Volume2 size={18} />

          <div className={styles.volume}>
            <div />
          </div>

          <button>
            <MoreHorizontal size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
