"use client";

import { useEffect, useRef } from "react";
import { refresh, getMe } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/store/auth";

export function AuthBootstrap() {
  const setSession = useAuthStore((state) => state.setSession);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clear = useAuthStore((state) => state.clear);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        const { accessToken } = await refresh();
        setAccessToken(accessToken);
        const user = await getMe();
        setSession(user, accessToken);
      } catch {
        clear();
      }
    })();
  }, [setSession, setAccessToken, clear]);

  return null;
}
