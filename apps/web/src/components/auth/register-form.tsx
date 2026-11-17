"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { register } from "../../lib/api/auth";
import { getPostAuthPath } from "../../lib/next-path";
import { useAuthStore } from "../../lib/store/auth";
import styles from "./auth-shell.module.css";

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      register({
        displayName: displayName.trim() || undefined,
        email,
        password,
      }),
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
        <p className={styles.eyebrow}>Start your journal</p>
        <h1 className={styles.title}>Register</h1>
        <p className={styles.hint}>
          One account, and every preview you play starts counting.
        </p>
      </div>

      <label className={styles.field}>
        <span>Display name</span>
        <input
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={styles.input}
          placeholder="How should we call you? (optional)"
        />
      </label>

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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={styles.input}
          placeholder="At least 8 characters, with a letter and a number"
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
        {mutation.isPending ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
