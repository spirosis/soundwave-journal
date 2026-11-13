import { LogoMark } from "../app/logo-mark";
import styles from "./auth-shell.module.css";

interface AuthShellProps {
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <main className={`${styles.root} aurora`}>
      <div className={styles.layout}>
        <section className={styles.story}>
          <div className={styles.brand}>
            <LogoMark size="lg" />
            <span className={styles.wordmark}>SoundWave Journal</span>
          </div>

          <h2 className={styles.headline}>Every preview leaves a trace.</h2>

          <p className={styles.lead}>
            Search real tracks on Deezer, keep the ones that stay with you, and
            watch your listening habits take shape in a journal built from what
            you actually play.
          </p>

          <ul className={styles.points}>
            <li>30-second previews straight from Deezer&apos;s catalog</li>
            <li>Favorites, playlists and a journal of plays, skips and completes</li>
            <li>Recommendations explained by your own history, not a black box</li>
          </ul>
        </section>

        <section className={styles.panel}>
          <div className={styles.card}>{children}</div>
          <p className={styles.footer}>{footer}</p>
        </section>
      </div>
    </main>
  );
}
