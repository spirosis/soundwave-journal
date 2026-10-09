"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Search,
  Home,
  BookOpen,
  Library,
  Compass,
  ListMusic,
} from "lucide-react";

import { logout } from "../../lib/api/auth";
import { getPlaylists } from "../../lib/api/playlists";
import { useAuthStore } from "../../lib/store/auth";
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
          {playlistsQuery.isLoading ? (
            <p className={styles.sidebarMuted}>Loading playlists...</p>
          ) : playlistsQuery.error ? (
            <p className={styles.sidebarMuted}>Could not load playlists</p>
          ) : playlists.length === 0 ? (
            <p className={styles.sidebarMuted}>
              No playlists yet. Create one in Library.
            </p>
          ) : (
            playlists.slice(0, 5).map((playlist) => (
              <Link
                key={playlist.id}
                href="/library"
                className={styles.sidebarPlaylistItem}
              >
                <strong>{playlist.name}</strong>
              </Link>
            ))
          )}
        </div>
      </aside>

      {/* MAIN */}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <Link href="/search" className={styles.search}>
            <Search size={17} />
            <span>Search songs, artists, albums or moods</span>
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
      </main>

      {/* PLAYER */}

      <footer className={styles.player}>
        <p className={styles.playerComingSoon}>Preview player coming soon</p>
      </footer>
    </div>
  );
}
