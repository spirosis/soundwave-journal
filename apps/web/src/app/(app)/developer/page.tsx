import type { Metadata } from "next";
import { MusicShell } from "../../../components/app/music-shell";
import { RateLimitDashboard } from "../../../components/developer/rate-limit-dashboard";

export const metadata: Metadata = { title: "Developer diagnostics" };

export default function DeveloperPage() {
  return (
    <MusicShell>
      <RateLimitDashboard />
    </MusicShell>
  );
}
