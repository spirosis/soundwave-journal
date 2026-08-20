"use client";

import { ChevronRight, Play } from "lucide-react";

import { MusicShell } from "../../components/app/music-shell";
import styles from "./home.module.css";

type MusicCard = {
  id: number;
  title: string;
  subtitle: string;
  image: string;
};

const moods: MusicCard[] = [
  {
    id: 1,
    title: "Focus",
    subtitle: "Deep concentration",
    image: "/images/moods/focus.svg",
  },
  {
    id: 2,
    title: "Energy",
    subtitle: "Push yourself",
    image: "/images/moods/energy.svg",
  },
  {
    id: 3,
    title: "Melancholy",
    subtitle: "Slow & reflective",
    image: "/images/moods/melancholy.svg",
  },
  {
    id: 4,
    title: "Relax",
    subtitle: "Breathe & unwind",
    image: "/images/moods/relax.svg",
  },
  {
    id: 5,
    title: "Night Drive",
    subtitle: "After dark",
    image: "/images/moods/night-drive.svg",
  },
];

const journalEntries: MusicCard[] = [
  {
    id: 1,
    title: "A quiet Sunday",
    subtitle: "7 songs · Aug 18",
    image: "/images/journal/journal-1.svg",
  },
  {
    id: 2,
    title: "Late night thoughts",
    subtitle: "12 songs · Aug 16",
    image: "/images/journal/journal-2.svg",
  },
  {
    id: 3,
    title: "Back to drawing",
    subtitle: "9 songs · Aug 14",
    image: "/images/journal/journal-3.svg",
  },
  {
    id: 4,
    title: "Training Day",
    subtitle: "15 songs · Aug 12",
    image: "/images/journal/journal-4.svg",
  },
];

const explore: MusicCard[] = [
  {
    id: 1,
    title: "Progressive Worlds",
    subtitle: "For your recent listening",
    image: "/images/explore/explore-1.svg",
  },
  {
    id: 2,
    title: "Dark Atmospheres",
    subtitle: "Music for immersion",
    image: "/images/explore/explore-2.svg",
  },
  {
    id: 3,
    title: "Creative Flow",
    subtitle: "Selected for drawing",
    image: "/images/explore/explore-3.svg",
  },
];

const playlists: MusicCard[] = [
  {
    id: 1,
    title: "High Distortion",
    subtitle: "45 songs · 95 min",
    image: "/images/playlists/playlist-1.svg",
  },
  {
    id: 2,
    title: "Easy Breezy Beats",
    subtitle: "23 songs · 40 min",
    image: "/images/playlists/playlist-2.svg",
  },
  {
    id: 3,
    title: "Mellow Moments",
    subtitle: "45 songs · 95 min",
    image: "/images/playlists/playlist-3.svg",
  },
  {
    id: 4,
    title: "Late Night",
    subtitle: "31 songs · 73 min",
    image: "/images/playlists/playlist-4.svg",
  },
];

function Card({ item, large = false }: { item: MusicCard; large?: boolean }) {
  return (
    <article className={`${styles.card} ${large ? styles.cardLarge : ""}`}>
      <div className={styles.coverWrapper}>
        <img src={item.image} alt={item.title} className={styles.cover} />

        <button className={styles.cardPlay} aria-label={`Play ${item.title}`}>
          <Play size={16} fill="currentColor" />
        </button>
      </div>

      <h3>{item.title}</h3>
      <p>{item.subtitle}</p>
    </article>
  );
}

function Section({
  title,
  children,
  action = "View all",
}: {
  title: string;
  children: React.ReactNode;
  action?: string;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>

        <button className={styles.viewAll}>
          {action}
          <ChevronRight size={17} />
        </button>
      </div>

      {children}
    </section>
  );
}

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

      <Section title="Moods & Activities">
        <div className={styles.horizontalScroll}>
          {moods.map((mood) => (
            <Card key={mood.id} item={mood} large />
          ))}
        </div>
      </Section>

      <Section title="My Journal" action="Open journal">
        <div className={styles.gridFour}>
          {journalEntries.map((entry) => (
            <Card key={entry.id} item={entry} />
          ))}
        </div>
      </Section>

      <Section title="Explore">
        <div className={styles.exploreGrid}>
          {explore.map((item) => (
            <Card key={item.id} item={item} large />
          ))}
        </div>
      </Section>

      <Section title="My Playlists">
        <div className={styles.gridFour}>
          {playlists.map((playlist) => (
            <Card key={playlist.id} item={playlist} />
          ))}
        </div>
      </Section>
    </MusicShell>
  );
}
