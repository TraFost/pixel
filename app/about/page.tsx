import type { Metadata } from 'next';
import room from '@/components/room/room.json';
import { Keepsakes, Timeline } from '@/components/About';
import { Reader } from '@/components/Reader';
import { Screen, Sprite } from '@/components/sections';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'About', description: 'Who is at the desk, and how the desk was made.' };

export default function About() {
  return (
    <Screen section="about" title="About" lede="A scrapbook, kept in the notebook on the desk." sprite={<Sprite box={room.hotspots.about} scale={3} />} status="4 pages">
      <Reader>
        <section className="chapter">
          <h2><span className="num" aria-hidden>01</span>At the desk</h2>
          <div className="prose">{site.about.map(p => <p key={p}>{p}</p>)}</div>
        </section>

        <section className="chapter">
          <h2><span className="num" aria-hidden>02</span>So far</h2>
          <Timeline />
        </section>

        <section className="chapter">
          <h2><span className="num" aria-hidden>03</span>On the desk</h2>
          <Keepsakes />
        </section>

        <section className="chapter">
          <h2><span className="num" aria-hidden>04</span>Colophon</h2>
          <ul className="squares prose">
            <li>The room is a 480×270 Aseprite file in 29 colours. The case study “This room”, on the computer, explains how it works.</li>
            <li>Type is IBM Plex Sans for reading, Pixelify Sans for headings and Silkscreen for small labels. All are under the SIL Open Font License and served from this site.</li>
            <li>Sound is synthesised in the browser. The radio on the shelf switches it off, and so does the M key.</li>
            <li>The print above the lamp is Guts, from Kentaro Miura’s <cite>Berserk</cite>. Fan art, drawn for this room.</li>
            <li>The rock on five legs who walks in, waves and keeps guard on the bed is Rocky, from Andy Weir’s <cite>Project Hail Mary</cite>. Fan art too.</li>
          </ul>
        </section>
      </Reader>
    </Screen>
  );
}
