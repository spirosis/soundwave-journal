"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, Library, Search } from "lucide-react";

import { MusicShell } from "../../components/app/music-shell";
import { HomeInsights } from "../../components/home/home-insights";
import { useAuthStore } from "../../lib/store/auth";
import styles from "./home.module.css";

const quickActions = [
  {
    href: "/search",
    label: "Search tracks",
    description: "Find tracks and artists in Deezer's catalog.",
    icon: Search,
  },
  {
    href: "/journal",
    label: "Open journal",
    description: "Review and log your listening activity.",
    icon: BookOpen,
  },
  {
    href: "/library",
    label: "Manage library",
    description: "Favorites and playlists you've built.",
    icon: Library,
  },
  {
    href: "/discovery",
    label: "Explore genres",
    description: "Browse genres to find new tracks.",
    icon: Compass,
  },
];

function greetingForHour(hour: number): string {
  if (hour < 5) return "Still listening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  // Home only renders client-side (AuthGuard gates it until the session is
  // restored), so reading the clock here can't cause a hydration mismatch.
  const greeting = greetingForHour(new Date().getHours());
  const name = user?.displayName?.trim();

  return (
    <MusicShell active="home">
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Your listening journal</p>

          <h1 className={styles.heroTitle}>
            {greeting}
            {name ? (
              <>
                , <span className={styles.heroName}>{name}</span>
              </>
            ) : null}
            .
          </h1>

          <p className={styles.heroDescription}>
            Every preview you play here leaves a trace: favorites, playlists,
            and a journal that learns the rhythm of your listening.
          </p>

          <div className={styles.heroActions}>
            <Link href="/search" className={styles.heroPrimary}>
              <Search size={16} />
              Start with a search
            </Link>
            <Link href="/journal" className={styles.heroSecondary}>
              See your journal
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        <div className={styles.orbWrap} aria-hidden="true">
          <div className={styles.orb} />
          <div className={styles.orbRing} />
        </div>
      </section>

      <HomeInsights />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Where to next</p>
          <h2>Quick actions</h2>
        </div>

        <div className={styles.actionsGrid}>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={styles.actionCard}
            >
              <span className={styles.actionIcon}>
                <action.icon size={18} />
              </span>
              <strong>{action.label}</strong>
              <p>{action.description}</p>
              <ArrowUpRight size={16} className={styles.actionArrow} />
            </Link>
          ))}
        </div>
      </section>
    </MusicShell>
  );
}
