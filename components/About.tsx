'use client';

import { useState, type KeyboardEvent } from 'react';
import { Sprite } from '@/components/sections';
import { timeline } from '@/content/site';
import { play } from '@/lib/sound';
import room from '@/components/room/room.json';
import s from './About.module.css';

export function Timeline() {
  const [at, setAt] = useState(timeline.length - 1);
  const entry = timeline[at];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    const next = (at + step + timeline.length) % timeline.length;
    e.preventDefault();
    setAt(next);
    e.currentTarget.querySelectorAll('button')[next].focus();
  };

  return (
    <div className={s.timeline}>
      <div className={s.track} role="tablist" aria-label="Timeline" onKeyDown={onKeyDown}>
        {timeline.map((t, i) => (
          <button key={t.title} type="button" role="tab" id={`when-${i}`} aria-selected={i === at} aria-controls="memory" tabIndex={i === at ? 0 : -1} onClick={() => { setAt(i); play('page'); }}>
            <i aria-hidden />
            {t.when || '????'}
          </button>
        ))}
      </div>
      <div key={at} id="memory" className={s.memory} role="tabpanel" aria-labelledby={`when-${at}`} data-blank={!entry.text || undefined}>
        <p className={s.when}>{entry.when || '????'}</p>
        <h3>{entry.title}</h3>
        <p>{entry.text || 'This page of the scrapbook is still blank. The story is coming.'}</p>
      </div>
    </div>
  );
}

const KEEPSAKES = [
  { box: room.crops.print, text: 'Above the lamp: Guts, from Kentaro Miura’s Berserk. Fan art.' },
  { box: room.hotspots.cat, text: 'The cat. Go on, press it.', meows: true },
  { box: room.hotspots.radio, text: 'The radio. It only ever plays rain.' },
  { box: room.hotspots.notes, text: 'Two floppy disks, for the notes.' },
];

export function Keepsakes() {
  return (
    <ul className={s.keepsakes}>
      {KEEPSAKES.map(k => (
        <li key={k.text}>
          {k.meows
            ? <button type="button" aria-label="The cat: press for a meow" onClick={() => play('meow')}><Sprite box={k.box} scale={3} /></button>
            : <Sprite box={k.box} scale={3} />}
          <p>{k.text}</p>
        </li>
      ))}
    </ul>
  );
}
