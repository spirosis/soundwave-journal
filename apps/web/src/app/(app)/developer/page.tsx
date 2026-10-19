import { MusicShell } from "../../../components/app/music-shell";
import { RateLimitDashboard } from "../../../components/developer/rate-limit-dashboard";

export default function DeveloperPage() {
  return (
    <MusicShell>
      <RateLimitDashboard />
    </MusicShell>
  );
}
