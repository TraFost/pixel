'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { pad } from '@/components/sections';
import s from './Reader.module.css';

export function Reader({ chapters = [], full, children }: { chapters?: { id: string; title: string }[]; full?: boolean; children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null), rail = useRef<HTMLElement>(null);
  const [active, setActive] = useState(chapters[0]?.id);

  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => {
      const room = root.scrollHeight - innerHeight;
      root.style.setProperty('--read', String(room > 0 ? Math.round((scrollY / room) * 24) / 24 : 0));
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      root.style.removeProperty('--read');
    };
  }, []);

  useEffect(() => {
    const el = body.current!;
    const spy = new IntersectionObserver(
      entries => { for (const e of entries) if (e.isIntersecting) setActive(e.target.id); },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    el.querySelectorAll('section[id]').forEach(section => spy.observe(section));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => spy.disconnect();

    // Only what starts below the fold is hidden, so nothing already on screen ever blinks.
    const reveal = new IntersectionObserver(entries => {
      for (const e of entries) {
        const target = e.target as HTMLElement;
        if (e.isIntersecting) { target.dataset.reveal = 'in'; reveal.unobserve(target); }
        else target.dataset.reveal ??= 'wait';
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    el.querySelectorAll('section, figure, aside').forEach(block => reveal.observe(block));
    return () => { spy.disconnect(); reveal.disconnect(); };
  }, []);

  useEffect(() => {
    const link = rail.current?.querySelector('[aria-current]');
    link?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [active]);

  const jump = (e: MouseEvent, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id)!;
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    target.focus({ preventScroll: true });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className={s.reader} data-rail={chapters.length > 0 || undefined} data-full={full || undefined}>
      {chapters.length > 0 && (
        <nav ref={rail} className={s.rail} aria-label="Chapters">
          <p className="label">Chapters</p>
          <ol>
            {chapters.map((c, i) => (
              <li key={c.id}>
                <a href={`#${c.id}`} aria-current={c.id === active ? 'location' : undefined} onClick={e => jump(e, c.id)}>
                  <span aria-hidden>{pad(i + 1)}</span>{c.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div ref={body} className={s.body}>{children}</div>
    </div>
  );
}
