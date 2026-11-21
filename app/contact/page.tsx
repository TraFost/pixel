import type { Metadata } from 'next';
import { ContactList, Screen } from '@/components/sections';

export const metadata: Metadata = { title: 'Contact', description: 'Email, GitHub, LinkedIn and CV.' };

export default function Contact() {
  return (
    <Screen section="contact" title="Contact" status="line open">
      <ContactList />
    </Screen>
  );
}
