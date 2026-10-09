import { MusicShell } from "../../../components/app/music-shell";
import { JournalView } from "../../../components/journal/journal-view";

export default function JournalPage() {
  return (
    <MusicShell active="journal">
      <JournalView />
    </MusicShell>
  );
}
