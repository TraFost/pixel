import type { Metadata } from 'next';
import { Screen, WorkList } from '@/components/sections';
import { projects } from '@/content/projects';

export const metadata: Metadata = { title: 'Work', description: 'Selected projects and case studies.' };

export default function Work() {
  return (
    <Screen section="work" title="Work" lede="Selected projects, written as case studies. Pick a file." status={`${projects.length} files`}>
      <WorkList />
    </Screen>
  );
}
