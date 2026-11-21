'use client';

import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Go } from '@/components/Travel';
import { sections, tour } from '@/content/site';
import { play, PURR_SECONDS, SOUND_EVENT, soundWanted, toggleSound } from '@/lib/sound';
import room from './room.json';
import s from './PixelRoom.module.css';

type Box = { x: number; y: number; w: number; h: number };

// Reset by every full page load, kept while moving between pages: a refresh replays the tour,
// coming Back from a page does not.
let toured = false;

// Everything is placed in percentages of the art, so it scales with the image.
const pct = (n: number, of: number) => `${(n / of) * 100}%`;
const place = (b: Box): CSSProperties => ({
  left: pct(b.x, room.w), top: pct(b.y, room.h), width: pct(b.w, room.w), height: pct(b.h, room.h),
});
// The hover layer, cropped to one hotspot.
const outline = (b: Box): CSSProperties => ({
  backgroundSize: `${pct(room.w, b.w)} ${pct(room.h, b.h)}`,
  backgroundPosition: `${pct(b.x, room.w - b.w)} ${pct(b.y, room.h - b.h)}`,
});

export function PixelRoom() {
  const stage = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number | null>(null); // tour step, or null when it is not running
  const [sound, setSound] = useState(true);
  const [purring, setPurring] = useState(false);
  const leftCat = useRef(-Infinity); // when the mouse last left the cat
  const lit = step === null ? undefined : tour[step].spot;

  // When the room is wider than the screen, start centred on the desk.
  useLayoutEffect(() => {
    const el = stage.current!, boxes = sections.map(sec => room.hotspots[sec.key]);
    const mid = (Math.min(...boxes.map(b => b.x)) + Math.max(...boxes.map(b => b.x + b.w))) / 2;
    el.scrollLeft = (mid / room.w) * el.scrollWidth - el.clientWidth / 2;
  }, []);

  useEffect(() => {
    if (!toured) setStep(0);
  }, []);
  const endTour = () => {
    setStep(null);
    toured = true;
  };

  // Bring the object being described into view (matters when the room pans).
  useEffect(() => {
    if (!lit) return;
    const el = stage.current!, b = room.hotspots[lit];
    el.scrollTo({ left: ((b.x + b.w / 2) / room.w) * el.scrollWidth - el.clientWidth / 2, behavior: 'smooth' });
  }, [lit]);

  // Pet the cat: it purrs, eyes shut, for a few seconds.
  useEffect(() => {
    if (!purring) return;
    const timer = setTimeout(() => setPurring(false), PURR_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [purring]);

  // The radio shows whether sound is on, wherever it was switched.
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
              unoptimized // the optimiser would resample and blur the pixels
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
              // One meow per visit: staying on the cat stays quiet, and so does brushing back and forth
              // over its edge. The mouse has to have been away for a moment first.
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
        ? <button type="button" className={`btn ${s.help}`} aria-label="Show the tour again" onClick={() => setStep(0)}>?</button>
        : <Tour step={step} onNext={() => (step + 1 < tour.length ? setStep(step + 1) : endTour())} onSkip={endTour} />}
    </>
  );
}

// A game-style dialogue box: the line types itself out, Next finishes the line or moves on.
function Tour({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const { text } = tour[step];
  // How much of the line is typed, tagged with the step it belongs to. A count left over from the
  // previous step reads as 0, so a new line can never flash up already written.
  const [typed, setTyped] = useState({ step, n: 0 });
  const shown = typed.step === step ? typed.n : 0;
  const next = useRef<HTMLButtonElement>(null);
  const typing = shown < text.length, last = step === tour.length - 1;

  useEffect(() => {
    next.current?.focus();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setTyped({ step, n: text.length });
    // Each tick adds one letter to whatever is there, so finishing the line early cannot be undone.
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
    <section className={`${s.tour} paper`} aria-label="Tour of the room">
      <header>
        <span className="label">The room</span>
        <span className={s.pips} aria-hidden>{tour.map((_, i) => <i key={i} data-done={i <= step || undefined} />)}</span>
        <span className="sr-only">Step {step + 1} of {tour.length}</span>
      </header>
      {/* The untyped part is laid out but invisible, so the box never changes size. */}
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
