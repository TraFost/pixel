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
