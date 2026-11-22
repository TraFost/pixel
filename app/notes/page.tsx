import type { Metadata } from 'next';
import { NotesDesk } from '@/components/Notes';
import { Screen } from '@/components/sections';
import { notes } from '@/content/notes';

export const metadata: Metadata = { title: 'Notes', description: 'Technical writing and experiments.' };

export default function Notes() {
  return (
    <Screen section="notes" title="Notes" lede="Short technical notes, one per disk. Pick one to read it." status={`${notes.length} disks`}>
      <NotesDesk />
    </Screen>
  );
}
