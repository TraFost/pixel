'use client';

import { useEffect, useState } from 'react';
import { Reader } from '@/components/Reader';
import { Prose } from '@/components/sections';
import { minutes } from '@/content/blocks';
import { notes } from '@/content/notes';
import { play } from '@/lib/sound';
import s from './Notes.module.css';

const TAGS = [...new Set(notes.map(n => n.tag))];
const day = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const preview = (text: string) => (text.length > 170 ? `${text.slice(0, text.lastIndexOf(' ', 170))}…` : text);

export function NotesDesk() {
  const [tag, setTag] = useState<string>();
  // The slug being read, null for the index. Undefined until the page is live: until then every note
  // is laid out below the index, so it all still reads, and its links still work, without JavaScript.
  const [open, setOpen] = useState<string | null>();

  useEffect(() => {
    const sync = () => setOpen(notes.find(n => n.slug === location.hash.slice(1))?.slug ?? null);
    sync();
    addEventListener('hashchange', sync);
    addEventListener('popstate', sync);
    return () => {
      removeEventListener('hashchange', sync);
      removeEventListener('popstate', sync);
    };
  }, []);

  useEffect(() => {
    if (open) document.getElementById(open)!.scrollIntoView();
    else if (open === null) scrollTo(0, 0);
  }, [open]);

  const toIndex = () => {
    history.pushState(null, '', location.pathname);
    setOpen(null);
    play('click');
  };

  return (
    <Reader full={!!open}>
      <div className={s.front} hidden={!!open}>
        <div className={s.tabs} role="group" aria-label="Categories">
          {[undefined, ...TAGS].map(t => (
            <button key={t ?? 'all'} type="button" aria-pressed={tag === t} onClick={() => setTag(t)}>
              {t ?? 'All'} <span>{notes.filter(n => !t || n.tag === t).length}</span>
            </button>
          ))}
        </div>
        <ol className={s.index}>
          {notes.filter(n => !tag || n.tag === tag).map(n => (
            <li key={n.slug}>
              <a href={`#${n.slug}`} onClick={() => play('floppy')}>
                <i aria-hidden className={s.disk} data-tag={TAGS.indexOf(n.tag)} />
                <span>
                  <span className="label">{n.tag} · {day(n.date)} · {minutes(n.body)} min read</span>
                  <strong>{n.title}</strong>
                  <span>{n.summary}</span>
                  <span>{preview(n.body.find(b => typeof b === 'string') as string)}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      {notes.map((n, i) => (
        <article key={n.slug} id={n.slug} className={s.note} hidden={open !== undefined && open !== n.slug} data-open={open === n.slug || undefined}>
          <header>
            <button type="button" className="btn" onClick={toIndex}>◀ All notes</button>
            <p className="label">{n.tag} · {day(n.date)} · {minutes(n.body)} min read</p>
            <h2>{n.title}</h2>
            <p className="lede">{n.summary}</p>
          </header>
          <div className="prose"><Prose blocks={n.body} /></div>
          <footer>
            <span className="label">Next disk</span>
            <a href={`#${notes[(i + 1) % notes.length].slug}`} onClick={() => play('floppy')}>{notes[(i + 1) % notes.length].title} ▶</a>
          </footer>
        </article>
      ))}
    </Reader>
  );
}
