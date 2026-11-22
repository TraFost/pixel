'use client';

import { useState } from 'react';
import { site } from '@/content/site';
import { play } from '@/lib/sound';
import s from './Contact.module.css';

const bare = (url: string) => url.replace(/^https?:\/\//, '');
const LINES = [
  site.email && { label: 'Email', href: `mailto:${site.email}`, text: site.email },
  site.github && { label: 'GitHub', href: site.github, text: bare(site.github) },
  site.linkedin && { label: 'LinkedIn', href: site.linkedin, text: bare(site.linkedin) },
  site.cv && { label: 'CV', href: site.cv, text: 'Download (PDF)' },
].filter(line => !!line);

export function Stationery() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(site.email);
    setCopied(true);
    play('click');
  };

  return (
    <div className={s.sheet}>
      <header className={s.head}>
        <p className="label">From the desk of</p>
        <p className={s.name}>{site.name}</p>
      </header>

      {LINES.length > 0
        ? (
          <ul className={s.lines}>
            {LINES.map(line => (
              <li key={line.label}>
                <a href={line.href}><span className="label">{line.label}</span>{line.text}</a>
              </li>
            ))}
          </ul>
        )
        : <p className={s.none}>The line is not connected yet. Contact details are coming.</p>}

      <div className={s.post}>
        <button type="button" className={s.envelope} aria-expanded={open} aria-controls="letter" onClick={() => { setOpen(!open); play('page'); }}>
          <svg viewBox="0 -16 64 60" aria-hidden>
            <rect className={s.ink} x="0" y="8" width="64" height="36" />
            <rect className={s.back} x="2" y="10" width="60" height="32" />
            <g className={s.raised}>
              <polygon className={s.ink} points="0,8 64,8 32,-14" />
              <polygon className={s.lid} points="4,6 60,6 32,-11" />
            </g>
            <g className={s.sheetIn}>
              <rect className={s.ink} x="8" y="12" width="48" height="30" />
              <rect className={s.paper} x="10" y="14" width="44" height="28" />
              <rect className={s.ink} x="14" y="19" width="26" height="2" />
              <rect className={s.ink} x="14" y="24" width="36" height="2" />
              <rect className={s.ink} x="14" y="29" width="30" height="2" />
            </g>
            <polygon className={s.pocket} points="2,42 2,14 32,32 62,14 62,42" />
            <polyline className={s.fold} points="2,14 32,32 62,14" />
            <g className={s.flap}>
              <polygon className={s.ink} points="0,8 64,8 32,30" />
              <polygon className={s.lid} points="4,10 60,10 32,27" />
              <rect className={s.seal} x="29" y="19" width="6" height="6" />
            </g>
          </svg>
          <span className="label">{open ? 'Close the envelope' : 'Open the envelope'}</span>
        </button>

        <div id="letter" className={s.letter} hidden={!open}>
          {site.email
            ? (
              <>
                <p>Write to <a href={`mailto:${site.email}`}>{site.email}</a>. It lands on this desk.</p>
                <button type="button" className="btn" onClick={copy}>{copied ? 'Copied' : 'Copy the address'}</button>
                <span className="sr-only" aria-live="polite">{copied ? 'Address copied.' : ''}</span>
              </>
            )
            : <p>There is nothing to post it to yet. An address is coming.</p>}
        </div>
      </div>
    </div>
  );
}
