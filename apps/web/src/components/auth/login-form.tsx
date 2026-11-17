"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../lib/api/auth";
import { getPostAuthPath } from "../../lib/next-path";
import { useAuthStore } from "../../lib/store/auth";
import styles from "./auth-shell.module.css";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      router.push(getPostAuthPath());
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      className={styles.form}
    >
      <div>
        <p className={styles.eyebrow}>Welcome back</p>
        <h1 className={styles.title}>Login</h1>
        <p className={styles.hint}>
          Pick up your journal where you left it.
        </p>
      </div>

      <label className={styles.field}>
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={styles.input}
          placeholder="you@example.com"
          required
        />
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={styles.input}
          placeholder="Your password"
          required
        />
      </label>

      {mutation.error ? (
        <p className={styles.error} role="alert">
          {mutation.error.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={mutation.isPending}
        className={styles.submit}
      >
        {mutation.isPending ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
