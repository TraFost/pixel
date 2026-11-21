'use client';

import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Go } from '@/components/Travel';
import { sections, tour } from '@/content/site';
import { play, PURR_SECONDS, SOUND_EVENT, soundWanted, toggleSound } from '@/lib/sound';
import room from './room.json';
import s from './PixelRoom.module.css';

type Box = { x: number; y: number; w: number; h: number };

let toured = false;

const pct = (n: number, of: number) => `${(n / of) * 100}%`;
const place = (b: Box): CSSProperties => ({
  left: pct(b.x, room.w), top: pct(b.y, room.h), width: pct(b.w, room.w), height: pct(b.h, room.h),
});
const outline = (b: Box): CSSProperties => ({
  backgroundSize: `${pct(room.w, b.w)} ${pct(room.h, b.h)}`,
  backgroundPosition: `${pct(b.x, room.w - b.w)} ${pct(b.y, room.h - b.h)}`,
});

export function PixelRoom() {
  const stage = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number | null>(null);
  const [lines, setLines] = useState(tour);
  const [sound, setSound] = useState(true);
  const [purring, setPurring] = useState(false);
  const leftCat = useRef(-Infinity);
  const lit = step === null ? undefined : lines[step].spot;

  useLayoutEffect(() => {
    const el = stage.current!, boxes = sections.map(sec => room.hotspots[sec.key]);
    const mid = (Math.min(...boxes.map(b => b.x)) + Math.max(...boxes.map(b => b.x + b.w))) / 2;
    el.scrollLeft = (mid / room.w) * el.scrollWidth - el.clientWidth / 2;
  }, []);

  const startTour = () => {
    const el = stage.current!;
    setLines(tour.filter(line => !line.pan || el.scrollWidth > el.clientWidth));
    setStep(0);
  };
  useEffect(() => {
    if (!toured) startTour();
  }, []);
  const endTour = () => {
    setStep(null);
    toured = true;
  };

  useEffect(() => {
    if (!lit) return;
    const el = stage.current!, b = room.hotspots[lit];
    el.scrollTo({ left: ((b.x + b.w / 2) / room.w) * el.scrollWidth - el.clientWidth / 2, behavior: 'smooth' });
  }, [lit]);

  useEffect(() => {
    if (!purring) return;
    const timer = setTimeout(() => setPurring(false), PURR_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [purring]);

  useEffect(() => {
    setSound(soundWanted());
    const onSound = (e: Event) => setSound((e as CustomEvent<boolean>).detail);
    addEventListener(SOUND_EVENT, onSound);
    return () => removeEventListener(SOUND_EVENT, onSound);
  }, []);

  return (
    <>
      <div ref={stage} className={s.stage} style={{ background: room.wall }}>
        <div className={s.scene}>
          <div className={s.room} style={{ '--floor': room.floor.y / room.h, '--px': 1 / room.h } as CSSProperties}>
            <Image
              className={s.base}
              src="/art/room.png"
              width={room.w}
              height={room.h}
              unoptimized
              priority
              alt="A pixel-art room on a rainy night. Someone asleep in the bed under the window, a desk with a glowing CRT computer, floppy disks, a notebook and a telephone, an orange cat sitting on the chair, a print of Guts from Berserk above the lamp, and a bookshelf with a radio on top."
            />
            {room.loops.filter(a => sound || a.name !== 'notes').map(a => (
              <span
                key={a.name}
                aria-hidden
                className={s.loop}
                style={{ ...place(a), backgroundImage: `url(/art/${a.name}.png)`, animationDuration: `${room.ms}ms`, '--n': room.frames } as CSSProperties}
              />
            ))}
            {sections.map(spot => {
              const b = room.hotspots[spot.key];
              return (
                <Go key={spot.key} href={spot.href} label={spot.loading} sfx={spot.sfx} onClick={endTour} className={s.spot} style={place(b)} data-lit={lit === spot.key || undefined}>
                  <span aria-hidden className={s.hi} style={outline(b)} />
                  <span className={s.tip}>{spot.title}<span className="sr-only"> ({spot.object})</span></span>
                </Go>
              );
            })}
            <button
              type="button"
              className={s.spot}
              style={place(room.hotspots.radio)}
              aria-pressed={sound}
              data-lit={lit === 'radio' || undefined}
              onClick={() => { toggleSound(); play('click'); }}
            >
              <span aria-hidden className={s.hi} style={outline(room.hotspots.radio)} />
              <span className={s.tip}><span className="sr-only">Sound (the radio): </span><span aria-hidden>Radio: </span>{sound ? 'on' : 'off'}</span>
            </button>
            <button
              type="button"
              className={s.spot}
              style={place(room.hotspots.cat)}
              aria-label="Pet the cat"
              data-lit={lit === 'cat' || undefined}
              onPointerEnter={e => { if (e.pointerType === 'mouse' && performance.now() - leftCat.current > 1500) play('meow'); }}
              onPointerLeave={() => { leftCat.current = performance.now(); }}
              onClick={() => { play('purr'); setPurring(true); }}
            >
              <span aria-hidden className={s.hi} style={outline(room.hotspots.cat)} />
              {purring && <span aria-hidden className={s.loop} style={{ backgroundImage: 'url(/art/cat-alt.png)', animationDuration: `${room.ms}ms`, '--n': room.frames } as CSSProperties} />}
            </button>
          </div>
        </div>
      </div>

      {step === null
        ? <button type="button" className={`btn ${s.help}`} aria-label="Show the tour again" onClick={startTour}>?</button>
        : <Tour lines={lines} step={step} onNext={() => (step + 1 < lines.length ? setStep(step + 1) : endTour())} onSkip={endTour} />}
    </>
  );
}

function Tour({ lines, step, onNext, onSkip }: { lines: typeof tour; step: number; onNext: () => void; onSkip: () => void }) {
  const { text } = lines[step];
  const [typed, setTyped] = useState({ step, n: 0 });
  const shown = typed.step === step ? typed.n : 0;
  const box = useRef<HTMLElement>(null), next = useRef<HTMLButtonElement>(null);
  const [onTop, setOnTop] = useState(false);
  const typing = shown < text.length, last = step === lines.length - 1;

  useLayoutEffect(() => {
    const check = () => {
      const lit = document.querySelector('[data-lit]');
      setOnTop(!!lit && lit.getBoundingClientRect().bottom > innerHeight - box.current!.offsetHeight - 16);
    };
    check();
    addEventListener('resize', check);
    return () => removeEventListener('resize', check);
  }, [step]);

  useEffect(() => {
    next.current?.focus();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setTyped({ step, n: text.length });
    const timer = setInterval(() => setTyped(t => (t.step !== step ? { step, n: 1 } : t.n < text.length ? { step, n: t.n + 1 } : t)), 24);
    return () => clearInterval(timer);
  }, [step, text]);

  useEffect(() => {
    if (shown && typing) play('blip');
  }, [shown, typing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <section ref={box} className={`${s.tour} paper`} aria-label="Tour of the room" data-top={onTop || undefined}>
      <header>
        <span className="label">The room</span>
        <span className={s.pips} aria-hidden>{lines.map((_, i) => <i key={i} data-done={i <= step || undefined} />)}</span>
        <span className="sr-only">Step {step + 1} of {lines.length}</span>
      </header>
      <p aria-hidden>{text.slice(0, shown)}<span className={s.ghost}>{text.slice(shown)}</span></p>
      <p className="sr-only" aria-live="polite">{text}</p>
      <footer>
        <button type="button" className={s.skip} onClick={onSkip}>Skip</button>
        <button ref={next} type="button" className="btn" onClick={() => (typing ? setTyped({ step, n: text.length }) : onNext())}>
          {last && !typing ? 'Start' : 'Next'} <span aria-hidden className={typing ? undefined : s.blink}>▶</span>
        </button>
      </footer>
    </section>
  );
}
