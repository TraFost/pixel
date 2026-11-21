'use client';

// Every move between pages goes through here: the screen dissolves into big pixels spreading from
// whatever was clicked, a one-line loader shows, and the next page dissolves back in.
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, type ComponentProps } from 'react';
import { bootSound, play, toggleSound, type Sfx } from '@/lib/sound';
import s from './Travel.module.css';

type Trip = { href: string; label: string; x: number; y: number; night?: boolean };

let begin: ((trip: Trip) => void) | undefined;
export function travel(trip: Trip) {
  if (begin) begin(trip);
  else location.assign(trip.href); // the overlay is not mounted: just go
}

const wait = (ms: number) => new Promise<void>(done => setTimeout(done, ms));

export function Mosaic() {
  const router = useRouter(), pathname = usePathname();
  const wrap = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), caption = useRef<HTMLSpanElement>(null);
  const arrived = useRef<() => void>(undefined), busy = useRef(false);

  useEffect(() => { arrived.current?.(); }, [pathname]);

  useEffect(() => {
    bootSound();
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.matches('input, textarea, [contenteditable]');
      if (e.key.toLowerCase() === 'm' && !typing && !e.metaKey && !e.ctrlKey) toggleSound(); // mute from any page
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    begin = async trip => {
      if (busy.current) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return router.push(trip.href);
      busy.current = true;

      const el = wrap.current!, cv = canvas.current!, ctx = cv.getContext('2d')!;
      const cell = Math.max(16, Math.round(Math.max(innerWidth, innerHeight) / 56));
      const cols = Math.ceil(innerWidth / cell), rows = Math.ceil(innerHeight / cell);
      cv.width = cols; cv.height = rows; // one canvas pixel per cell, scaled up by CSS
      cv.style.width = `${cols * cell}px`; cv.style.height = `${rows * cell}px`;

      // When each cell flips, 0..1: distance from the click, plus noise for a ragged edge.
      const far = Math.hypot(Math.max(trip.x, innerWidth - trip.x), Math.max(trip.y, innerHeight - trip.y));
      const order = Float32Array.from({ length: cols * rows }, (_, i) =>
        0.85 * Math.hypot((i % cols + 0.5) * cell - trip.x, (Math.floor(i / cols) + 0.5) * cell - trip.y) / far + 0.15 * Math.random());
      const sweep = (cover: boolean) => new Promise<void>(done => {
        const t0 = performance.now();
        const frame = (now: number) => {
          const p = Math.min(1, (now - t0) / 380), q = Math.ceil(p * 10) / 10; // ten visible steps
          ctx.clearRect(0, 0, cols, rows);
          for (let i = 0; i < order.length; i++) if (order[i] <= q === cover) ctx.fillRect(i % cols, Math.floor(i / cols), 1, 1);
          if (p < 1) requestAnimationFrame(frame); else done();
        };
        requestAnimationFrame(frame);
      });

      ctx.fillStyle = trip.night ? '#242a38' : '#f4eedf';
      el.style.color = trip.night ? '#f4eedf' : '#292d32';
      caption.current!.textContent = trip.label;
      el.dataset.on = '';
      await sweep(true);

      el.dataset.loading = '';
      const there = new Promise<void>(done => { arrived.current = done; });
      if (trip.href === location.pathname) arrived.current!(); else router.push(trip.href);
      await Promise.all([Promise.race([there, wait(4000)]), wait(420)]); // the loader always gets its moment
      delete el.dataset.loading;

      await sweep(false);
      delete el.dataset.on;
      busy.current = false;
    };
    return () => { begin = undefined; };
  }, [router]);

  return (
    <div ref={wrap} className={s.wrap} aria-hidden>
      <canvas ref={canvas} />
      <div className={s.caption}><span ref={caption} /><i className={s.bar} /></div>
    </div>
  );
}

// A link that travels. Without JavaScript it is an ordinary link.
export function Go({ href, label = 'Loading', night, sfx = 'click', onClick, ...rest }: ComponentProps<'a'> & { href: string; label?: string; night?: boolean; sfx?: Sfx }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={e => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new-tab clicks stay links
        e.preventDefault();
        play(sfx);
        const r = e.currentTarget.getBoundingClientRect(); // keyboard clicks have no position: use the middle
        travel({ href, label, night, x: e.clientX || r.x + r.width / 2, y: e.clientY || r.y + r.height / 2 });
      }}
    />
  );
}

// The only way out of a page: back to the room. Escape does the same.
export function Back() {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') link.current?.click(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
  return <Go ref={link} href="/" night label="Back to the room" className="btn back">◀ Back</Go>;
}
