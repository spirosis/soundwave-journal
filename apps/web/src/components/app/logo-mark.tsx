import styles from "./logo-mark.module.css";

interface LogoMarkProps {
  size?: "sm" | "lg";
}

export function LogoMark({ size = "sm" }: LogoMarkProps) {
  return (
    <span
      className={size === "lg" ? `${styles.mark} ${styles.lg}` : styles.mark}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
