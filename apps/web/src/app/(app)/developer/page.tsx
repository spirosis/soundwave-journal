import { AppShell } from "../../../components/app/app-shell";
import { RateLimitDashboard } from "../../../components/developer/rate-limit-dashboard";

export default function DeveloperPage() {
  return (
    <AppShell
      title="Developer Mode"
      description="Diagnósticos reales del rate limiting activo en este proceso."
    >
      <RateLimitDashboard />
    </AppShell>
  );
}