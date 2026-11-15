import type { Metadata } from "next";
import { MusicShell } from "../../../components/app/music-shell";
import { PageHeader } from "../../../components/app/page-header";
import { RateLimitDashboard } from "../../../components/developer/rate-limit-dashboard";

export const metadata: Metadata = { title: "Developer diagnostics" };

export default function DeveloperPage() {
  return (
    <MusicShell>
      <PageHeader
        eyebrow="Developer"
        title="Under the hood."
        lead="A live mirror of the API's rate-limit consumption for this process. Diagnostics, not enforcement."
      />
      <RateLimitDashboard />
    </MusicShell>
  );
}
