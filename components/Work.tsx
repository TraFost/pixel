'use client';

import type { KeyboardEvent } from 'react';
import { pad } from '@/components/sections';
import { Go } from '@/components/Travel';
import { minutes } from '@/content/blocks';
import { projects } from '@/content/projects';
import s from './Work.module.css';

export function WorkMenu() {
  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    const rows = [...e.currentTarget.querySelectorAll('a')];
    e.preventDefault();
    rows[(rows.indexOf(document.activeElement as HTMLAnchorElement) + step + rows.length) % rows.length].focus();
  };

  return (
    <ol className={s.menu} onKeyDown={onKeyDown}>
      {projects.map((p, i) => (
        <li key={p.slug}>
          <Go href={`/work/${p.slug}`} label={`Opening ${p.slug}.txt`} sfx="page" className={s.row}>
            <span className={s.n} aria-hidden>{pad(i + 1)}</span>
            <span className={s.text}>
              <strong>{p.title}</strong>
              <span>{p.summary}</span>
              <span className={s.tags}>{p.tags.map(tag => <i key={tag}>{tag}</i>)}</span>
            </span>
            <span className={s.state}>{p.draft ? 'Outline' : `${minutes(p.sections.flatMap(sec => sec.body))} min read`}</span>
          </Go>
        </li>
      ))}
    </ol>
  );
}
