import type { Metadata } from "next";
import { MusicShell } from "../../../components/app/music-shell";
import { DiscoveryView } from "../../../components/discovery/discovery-view";

export const metadata: Metadata = { title: "Discovery" };

export default function DiscoveryPage() {
  return (
    <MusicShell active="explore">
      <DiscoveryView />
    </MusicShell>
  );
}
