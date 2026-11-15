"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, Home, BookOpen, Library, Compass } from "lucide-react";

import { logout } from "../../lib/api/auth";
import { getPlaylists } from "../../lib/api/playlists";
import { useAuthStore } from "../../lib/store/auth";
import { NowPlayingBar } from "../player/now-playing-bar";
import { usePreviewPlayer } from "../player/preview-player";
import { LogoMark } from "./logo-mark";
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
  active?: MusicShellActiveNav;
  children: React.ReactNode;
}

export function MusicShell({ active, children }: MusicShellProps) {
  const clear = useAuthStore((state) => state.clear);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: clear,
    onError: clear,
  });

  const playlistsQuery = useQuery({
    queryKey: ["playlists"],
    queryFn: getPlaylists,
  });

  const playlists = playlistsQuery.data ?? [];
  const hasPlayer = usePreviewPlayer().track !== null;

  return (
    <div className={`${styles.app} aurora ${hasPlayer ? styles.withPlayer : ""}`}>
      {/* Sidebar on desktop, bottom tab bar on small screens. Playlist items
          stay links: E2E specs look for playlist *buttons* inside <aside>,
          which belong to PlaylistsView's own aside on /library. */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          <LogoMark />
          <span className={styles.wordmark}>SoundWave Journal</span>
        </Link>

        <nav className={styles.navigation} aria-label="Primary">
          {navItems.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={isActive ? styles.activeNav : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarSection}>
          <p className={styles.sidebarLabel}>Your playlists</p>

          <div className={styles.sidebarPlaylists}>
            {playlistsQuery.isLoading ? (
              <p className={styles.sidebarMuted}>Loading playlists...</p>
            ) : playlistsQuery.error ? (
              <p className={styles.sidebarMuted}>Could not load playlists</p>
            ) : playlists.length === 0 ? (
              <p className={styles.sidebarMuted}>
                No playlists yet. Create one in Library.
              </p>
            ) : (
              playlists.slice(0, 6).map((playlist) => (
                <Link
                  key={playlist.id}
                  href="/library"
                  className={styles.sidebarPlaylistItem}
                >
                  <span className={styles.playlistDot} aria-hidden="true" />
                  <strong>{playlist.name}</strong>
                </Link>
              ))
            )}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.topbarBrand} aria-label="Home">
            <LogoMark />
          </Link>

          <Link href="/search" className={styles.search}>
            <Search size={17} />
            <span>Search tracks or artists</span>
          </Link>

          <div className={styles.topActions}>
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className={styles.logoutButton}
            >
              {logoutMutation.isPending ? "Signing out..." : "Logout"}
            </button>
          </div>
        </header>

        <div className={styles.content}>{children}</div>

        <NowPlayingBar />
      </main>
    </div>
  );
}
