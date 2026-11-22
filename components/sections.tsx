import { notes } from '@/content/notes';
import { site } from '@/content/site';
import type { CSSProperties, ReactNode } from 'react';
import { Figure } from '@/components/Figure';
import { Back } from '@/components/Travel';
import type { Block } from '@/content/blocks';
import { sections } from '@/content/site';
import room from '@/components/room/room.json';

type Box = { x: number; y: number; w: number; h: number };
type SectionKey = (typeof sections)[number]['key'];

export const pad = (n: number) => String(n).padStart(2, '0');

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

export function Screen({ section, file, eyebrow, title, lede, facts, sprite, status, children }: {
  section?: SectionKey; file?: string; eyebrow?: string; title: string; lede?: string; facts?: [label: string, value: string][];
  sprite?: ReactNode; status?: string; children: ReactNode;
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
              {facts && (
                <dl className="facts">
                  {facts.map(([label, value]) => <div key={label}><dt className="label">{label}</dt><dd>{value}</dd></div>)}
                </dl>
              )}
            </div>
            {sprite}
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

export function Prose({ blocks }: { blocks: Block[] }) {
  return blocks.map((block, i) => {
    if (typeof block === 'string') return <p key={i}>{block}</p>;
    if ('figure' in block) return <Figure key={i} name={block.figure} caption={block.caption} />;
    return (
      <figure key={i} className="code">
        <pre tabIndex={0}><code>{block.code}</code></pre>
        <figcaption>{block.caption}</figcaption>
      </figure>
    );
  });
}

const ICONS = ['var(--c-amber)', 'var(--c-night)', 'var(--c-sage)'];
const icon = (i: number) => <i aria-hidden className="ico" style={{ background: ICONS[i % ICONS.length] }} />;
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