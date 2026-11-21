import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Pixelify_Sans, Silkscreen } from 'next/font/google';
import { Mosaic } from '@/components/Travel';
import { site } from '@/content/site';
import '@/styles/tokens.css';
import '@/styles/global.css';

// next/font downloads these at build time and serves them from this site. Licences: /licenses.
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-mono' });
const pixel = Silkscreen({ subsets: ['latin'], weight: ['400'], variable: '--font-pixel' }); // tiny labels
const display = Pixelify_Sans({ subsets: ['latin'], variable: '--font-display' }); // headings and dialogue

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · ${site.role}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: 'website', images: [{ url: '/art/og.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#242a38' };

// No header and no footer: the room is the menu, and every page has one way back to it.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${pixel.variable} ${display.variable}`}>
      <body>
        {children}
        <Mosaic />
      </body>
    </html>
  );
}
