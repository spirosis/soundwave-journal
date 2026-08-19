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
  ChevronRight,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  MoreHorizontal,
  Heart,
} from "lucide-react";

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
          <Link className={styles.activeNav} href="/">
            <Home size={18} />
            Home
          </Link>

          <Link href="/journal">
            <BookOpen size={18} />
            Journal
          </Link>

          <Link href="/library">
            <Library size={18} />
            Library
          </Link>

          <Link href="/discovery">
            <Compass size={18} />
            Explore
          </Link>

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
        {/* HEADER */}

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

        <div className={styles.content}>
          {/* HERO */}

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
              Let your mood guide the music. Explore, journal and rediscover
              the soundtrack of your life.
            </p>
          </div>

          {/* MOODS */}

          <Section title="Moods & Activities">
            <div className={styles.horizontalScroll}>
              {moods.map((mood) => (
                <Card key={mood.id} item={mood} large />
              ))}
            </div>
          </Section>

          {/* JOURNAL */}

          <Section title="My Journal" action="Open journal">
            <div className={styles.gridFour}>
              {journalEntries.map((entry) => (
                <Card key={entry.id} item={entry} />
              ))}
            </div>
          </Section>

          {/* EXPLORE */}

          <Section title="Explore">
            <div className={styles.exploreGrid}>
              {explore.map((item) => (
                <Card key={item.id} item={item} large />
              ))}
            </div>
          </Section>

          {/* PLAYLISTS */}

          <Section title="My Playlists">
            <div className={styles.gridFour}>
              {playlists.map((playlist) => (
                <Card key={playlist.id} item={playlist} />
              ))}
            </div>
          </Section>
        </div>
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
