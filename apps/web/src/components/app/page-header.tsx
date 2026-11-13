import styles from "./page-header.module.css";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lead?: string;
  aside?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, lead, aside }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
      </div>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </header>
  );
}
