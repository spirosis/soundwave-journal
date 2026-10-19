"use client";

import Link from "next/link";
import { BookOpen, Compass, Library, Search } from "lucide-react";

import { MusicShell } from "../../components/app/music-shell";
import { HomeInsights } from "../../components/home/home-insights";
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

export default function HomePage() {
  return (
    <MusicShell active="home">
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>DISCOVER YOUR SOUND</p>

          <h1>
            What are you
            <br />
            feeling today?
          </h1>
        </div>

        <p className={styles.heroDescription}>
          Let your mood guide the music. Explore, journal and rediscover the
          soundtrack of your life.
        </p>
      </div>

      <HomeInsights />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Quick actions</h2>
        </div>

        <div className={styles.actionsGrid}>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={styles.actionCard}
            >
              <action.icon size={20} />
              <strong>{action.label}</strong>
              <p>{action.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </MusicShell>
  );
}
