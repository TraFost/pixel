// The pages behind the room. Each one is a window, as if opened on the room's computer.
import type { CSSProperties, ReactNode } from 'react';
import { Back, Go } from '@/components/Travel';
import { notes } from '@/content/notes';
import { projects } from '@/content/projects';
import { sections, site } from '@/content/site';
import room from '@/components/room/room.json';

type Box = { x: number; y: number; w: number; h: number };
type SectionKey = (typeof sections)[number]['key'];

// The three icon colours of the file window on the room's CRT.
const ICONS = ['var(--c-amber)', 'var(--c-night)', 'var(--c-sage)'];
const icon = (i: number) => <i aria-hidden className="ico" style={{ background: ICONS[i % ICONS.length] }} />;

// A crop of the room art.
export function Sprite({ box, scale = 2 }: { box: Box; scale?: number }) {
  const style: CSSProperties = {
    width: box.w * scale,
    height: box.h * scale,
    backgroundImage: 'url(/art/room.png)',
    backgroundSize: `${room.w * scale}px ${room.h * scale}px`,
    backgroundPosition: `${-box.x * scale}px ${-box.y * scale}px`,
  };
  return <span aria-hidden className="sprite" style={style} />;
}

// The window every page lives in. `file` is the title-bar text; `status` goes in the bar along the bottom.
export function Screen({ section, file, eyebrow, title, lede, sprite, status, children }: {
  section?: SectionKey; file?: string; eyebrow?: string; title: string; lede?: string; sprite?: ReactNode; status?: string; children: ReactNode;
}) {
  const sec = sections.find(s => s.key === section);
  return (
    <main className="screen">
      <article className="window paper">
        <header className="titlebar">
          <Back />
          <span className="file">{file ?? sec?.file}</span>
          <span className="dots" aria-hidden><i /><i /><i /></span>
        </header>
        <div className="pane">
          <div className="page-head">
            <div>
              <p className="label">{eyebrow ?? sec?.object}</p>
              <h1>{title}</h1>
              {lede && <p className="lede">{lede}</p>}
            </div>
            {sprite ?? (sec && <Sprite box={room.hotspots[sec.key]} />)}
          </div>
          {children}
        </div>
        <footer className="statusbar">
          <span>{status}</span>
          <span>Esc: back to the room</span>
        </footer>
      </article>
    </main>
  );
}

export function WorkList() {
  return (
    <ul className="files">
      {projects.map((p, i) => (
        <li key={p.slug}>
          <Go href={`/work/${p.slug}`} label={`Opening ${p.slug}.txt`} sfx="page">
            {icon(i)}
            <span>
              <strong>{p.title}</strong>
              <span>{p.summary}</span>
              <span className="meta">{p.draft ? 'outline only · ' : ''}{p.tags.join(' · ')}</span>
            </span>
            <b aria-hidden>▶</b>
          </Go>
        </li>
      ))}
    </ul>
  );
}

// One disk per note. `name` makes them an accordion: opening one closes the others.
export function NotesList() {
  return (
    <div className="files">
      {notes.map((n, i) => (
        <details key={n.slug} id={n.slug} name="note">
          <summary>
            {icon(i)}
            <span>
              <strong>{n.title}</strong>
              <span>{n.summary}</span>
              <span className="meta"><time dateTime={n.date}>{n.date}</time> · {Math.max(1, Math.round(n.body.join(' ').split(' ').length / 200))} min read</span>
            </span>
            <b aria-hidden>▶</b>
          </summary>
          <div className="prose">{n.body.map(p => <p key={p}>{p}</p>)}</div>
        </details>
      ))}
    </div>
  );
}

export function AboutBody() {
  return <>{site.about.map(p => <p key={p}>{p}</p>)}</>;
}

export function ContactList() {
  const links = [
    site.email && { label: 'Email', href: `mailto:${site.email}`, text: site.email },
    site.github && { label: 'GitHub', href: site.github, text: site.github.replace(/^https?:\/\//, '') },
    site.linkedin && { label: 'LinkedIn', href: site.linkedin, text: site.linkedin.replace(/^https?:\/\//, '') },
    site.cv && { label: 'CV', href: site.cv, text: 'Download (PDF)' },
  ].filter(Boolean) as { label: string; href: string; text: string }[];

  if (!links.length) return <p>The line is not connected yet. Contact details are coming.</p>;
  return (
    <dl className="contact">
      {links.map((l, i) => (
        <div key={l.label}>
          <dt className="label">{icon(i)}{l.label}</dt>
          <dd><a href={l.href}>{l.text}</a></dd>
        </div>
      ))}
    </dl>
  );
}
