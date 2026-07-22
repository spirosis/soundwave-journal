"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { register } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/store/auth";

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
      router.push("/");
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      className="flex w-full max-w-md flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
    >
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-stone-500">
          SoundWave Journal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Register</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Crea una cuenta para probar el flujo completo de sesión.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-stone-700">Display name</span>
        <input
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-950"
          placeholder="Tu nombre"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-stone-700">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-950"
          placeholder="tu-email@example.com"
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-stone-700">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-950"
          placeholder="Minimo 8 caracteres, letra y numero"
          required
        />
      </label>

      {mutation.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {mutation.error.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-2xl bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? "Creando cuenta..." : "Register"}
      </button>
    </form>
  );
}