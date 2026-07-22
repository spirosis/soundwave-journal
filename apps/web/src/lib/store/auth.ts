import { create } from "zustand";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  setSession: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "loading",

  setSession: (user, accessToken) =>
    set({
      user,
      accessToken,
      status: "authenticated",
    }),

  setAccessToken: (accessToken) =>
    set((state) => ({
      user: state.user,
      accessToken,
      status: state.user ? "authenticated" : state.status,
    })),

  setStatus: (status) => set({ status }),

  clear: () =>
    set({
      user: null,
      accessToken: null,
      status: "unauthenticated",
    }),
}));