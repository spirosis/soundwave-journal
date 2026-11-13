import type { Metadata } from "next";
import { MusicShell } from "../../../components/app/music-shell";
import { JournalView } from "../../../components/journal/journal-view";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <MusicShell active="journal">
      <JournalView />
    </MusicShell>
  );
}
