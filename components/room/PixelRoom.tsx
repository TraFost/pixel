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
let inBed = false; // Rocky walks in once per page load; after that he is found in bed

const WALK = 40; // art pixels a second
const POSES = ['run', 'wave', 'sleep', 'watch', 'talk', 'offer', 'bump', 'notice', 'tinker'] as const;
type Pose = (typeof POSES)[number];
type Point = { x: number; y: number };
const wait = (ms: number) => new Promise<void>(done => setTimeout(done, ms));

const pct = (n: number, of: number) => `${(n / of) * 100}%`;
const place = (b: Box): CSSProperties => ({
  left: pct(b.x, room.w), top: pct(b.y, room.h), width: pct(b.w, room.w), height: pct(b.h, room.h),
});
const strip = (file: string) => ({ backgroundImage: `url(/art/${file}.png)`, animationDuration: `${room.ms}ms`, '--n': room.frames }) as CSSProperties;
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
              alt="A pixel-art room on a rainy night. Someone asleep in the bed under the window, a desk with a glowing CRT computer, floppy disks, a notebook and a telephone, an orange cat sitting on the chair, a print of Guts from Berserk above the lamp, a bookshelf with a radio on top, and Rocky from Project Hail Mary, who walks in, waves, and keeps guard on the bed."
            />
            {room.loops.filter(a => sound || a.name !== 'notes').map(a => (
              <span
                key={a.name}
                aria-hidden
                className={s.loop}
                style={{ ...place(a), ...strip(a.name) }}
              />
            ))}
            <Rocky onMeetCat={() => { play('meow'); setPurring(true); }} />
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
              {purring && <span aria-hidden className={s.loop} style={strip('cat-alt')} />}
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

function Rocky({ onMeetCat }: { onMeetCat: () => void }) {
  const el = useRef<HTMLSpanElement>(null);
  const [pose, setPose] = useState<Pose>('run');
  const [line, setLine] = useState('');
  const walk = useRef<Animation[]>([]);
  const me = useRef<{ busy: boolean; held: boolean; pose: Pose; bump?: () => void }>({ busy: false, held: false, pose: 'run' }); // `pose` is what his routine has him doing, under any talk
  const rocky = room.actors.rocky;

  useEffect(() => {
    const node = el.current!, { rug, cat, bed, desk } = rocky.stops, floor = rug.y, self = me.current;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let at = bed, alive = true;
    const put = (to: Point) => {
      node.style.setProperty('--at-x', String(to.x));
      node.style.setProperty('--at-y', String(to.y));
    };
    const pause = async (ms: number) => {
      await wait(ms);
      while (self.busy) await wait(100); // his routine waits out a talk
      if (!alive) throw new Error('left the room');
    };
    const act = (as: Pose) => {
      self.pose = as;
      if (!self.busy) setPose(as);
    };
    const go = async (to: Point, ms = (Math.hypot(to.x - at.x, to.y - at.y) / WALK) * 1000, rise = 'linear') => {
      walk.current = [
        node.animate({ '--at-x': [at.x, to.x] }, { duration: ms, fill: 'forwards' }),
        node.animate({ '--at-y': [at.y, to.y] }, { duration: ms, fill: 'forwards', easing: rise }),
      ];
      await Promise.all(walk.current.map(a => a.finished));
      put(at = to);
      walk.current.forEach(a => a.cancel());
      walk.current = [];
    };
    // A hop up overshoots and comes down onto its mark; a hop down gathers itself first.
    const hop = (to: Point) => go(to, 450 + Math.abs(to.y - at.y) * 3, to.y < at.y ? 'cubic-bezier(0.3, 1.5, 0.6, 1)' : 'cubic-bezier(0.4, -0.5, 0.7, 0)');
    const settle = async () => {
      act('watch');
      await pause(7000);
      act('sleep');
    };
    const rounds = async () => {
      for (;;) {
        await pause(40000);
        act('run');
        await hop({ x: bed.x + 18, y: floor });
        await go({ x: desk.x, y: floor });
        await hop(desk);
        act('tinker');
        await pause(9000);
        act('run');
        await hop({ x: desk.x, y: floor });
        await go({ x: bed.x + 18, y: floor });
        await hop(bed);
        await settle();
      }
    };
    const arrive = async () => {
      const art = node.parentElement!.getBoundingClientRect(), scene = node.parentElement!.parentElement!.getBoundingClientRect();
      put(at = { x: ((scene.right - art.left) / art.height) * room.h + rocky.w, y: floor }); // just past the right-hand edge of the screen
      await go(rug);
      act('wave');
      await pause(3600);
      act('run');
      await go(cat);
      act('notice');
      onMeetCat();
      await pause(1800);
      act('run');
      await go({ x: bed.x + 18, y: floor });
      await hop(bed);
      inBed = true;
      await settle();
    };

    if (inBed || still) {
      put(bed);
      act('sleep');
    }
    (still ? Promise.resolve() : inBed ? rounds() : arrive().then(rounds)).catch(() => {}); // leaving the room rejects whatever he was waiting on
    return () => {
      alive = false;
      walk.current.forEach(a => a.cancel());
    };
  }, []);

  const hold = (held: boolean) => {
    me.current.held = held;
    if (me.current.busy || !walk.current.length) return;
    walk.current.forEach(a => (held ? a.pause() : a.play()));
    setPose(held ? 'wave' : 'run');
  };

  const wake = async () => {
    const self = me.current;
    if (self.bump) return self.bump();
    if (self.busy) return;
    self.busy = true;
    walk.current.forEach(a => a.pause());
    setPose('talk');
    setLine('Amaze!');
    play('chord');
    await wait(1800);
    setPose('offer');
    setLine('Fist my bump');
    const bumped = await new Promise<boolean>(done => {
      self.bump = () => done(true);
      setTimeout(() => done(false), 8000);
    });
    self.bump = undefined;
    setLine('');
    if (bumped) {
      setPose('bump');
      play('bump');
      await wait(900);
    }
    self.busy = false;
    setPose(self.pose);
    hold(self.held);
  };

  return (
    <span ref={el} className={s.actor} style={{ '--w': rocky.w, '--h': rocky.h } as CSSProperties}>
      {POSES.map(p => <span key={p} aria-hidden className={s.loop} style={{ ...strip(`rocky-${p}`), visibility: p === pose ? 'visible' : 'hidden' }} />)}
      {line && <span className={s.say} role="status">{line}</span>}
      <button
        type="button"
        aria-label={pose === 'offer' ? 'Bump Rocky’s fist' : 'Say hello to Rocky'}
        onPointerEnter={e => { if (e.pointerType === 'mouse') hold(true); }}
        onPointerLeave={() => hold(false)}
        onClick={wake}
      />
    </span>
  );
}
