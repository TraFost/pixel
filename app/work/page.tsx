import type { Metadata } from 'next';
import { Screen } from '@/components/sections';
import { WorkMenu } from '@/components/Work';
import { projects } from '@/content/projects';

export const metadata: Metadata = { title: 'Work', description: 'Selected projects and case studies.' };

export default function Work() {
  return (
    <Screen section="work" title="Work" lede="Selected projects, written as case studies. Pick a file." status={`${projects.length} files · ↑ ↓ to choose`}>
      <WorkMenu />
    </Screen>
  );
}
