import type { Metadata } from 'next';
import { Stationery } from '@/components/Contact';
import { Screen } from '@/components/sections';

export const metadata: Metadata = { title: 'Contact', description: 'Email, GitHub, LinkedIn and CV.' };

export default function Contact() {
  return (
    <Screen section="contact" title="Contact" lede="Pick up the telephone, or write." status="line open">
      <Stationery />
    </Screen>
  );
}
