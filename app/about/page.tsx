import type { Metadata } from 'next';
import { AboutBody, Screen } from '@/components/sections';

export const metadata: Metadata = { title: 'About', description: 'Who is at the desk, and how the desk was made.' };

export default function About() {
  return (
    <Screen section="about" title="About" status="2 parts">
      <div className="prose">
        <section className="chapter">
          <h2><span className="num" aria-hidden>01</span>At the desk</h2>
          <AboutBody />
        </section>

        <section className="chapter">
          <h2><span className="num" aria-hidden>02</span>Colophon</h2>
          <ul className="squares">
            <li>The room is a 480×270 Aseprite file in 27 colours. The case study “This room”, on the computer, explains how it works.</li>
            <li>Type is IBM Plex Sans for reading, Pixelify Sans for headings and Silkscreen for small labels. All are under the SIL Open Font License and served from this site.</li>
            <li>Sound is synthesised in the browser. The radio on the shelf switches it off, and so does the M key.</li>
            <li>The print above the lamp is Guts, from Kentaro Miura’s <cite>Berserk</cite>. Fan art, drawn for this room.</li>
          </ul>
        </section>
      </div>
    </Screen>
  );
}
