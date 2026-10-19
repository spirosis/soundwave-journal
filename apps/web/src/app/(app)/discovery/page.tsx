import { MusicShell } from "../../../components/app/music-shell";
import { DiscoveryView } from "../../../components/discovery/discovery-view";

export default function DiscoveryPage() {
  return (
    <MusicShell active="explore">
      <DiscoveryView />
    </MusicShell>
  );
}
