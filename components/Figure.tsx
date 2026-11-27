'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { FigureName } from '@/content/blocks';
import { play, SOUND_EVENT, soundWanted, type Sfx } from '@/lib/sound';
import room from '@/components/room/room.json';
import s from './Figure.module.css';

const STEPS = [
  { name: 'room.aseprite', text: 'The drawing: 480×270, a layer for every object, twelve frames, and a named slice round anything the page has to find.' },
  { name: 'bun run art', text: 'A small script reads the Aseprite file directly, flattens the layers and cuts out the slices.' },
  { name: 'PNG + JSON', text: 'It writes the room, the hover outlines, one strip per animated region, and room.json holding every rectangle.' },
  { name: 'The page', text: 'The page places its links and animations from room.json in percentages, so they scale with the art.' },
];

function Pipeline() {
  const [at, setAt] = useState(0);
  return (
    <>
      <ol className={s.pipe}>
        {STEPS.map((step, i) => (
          <li key={step.name}>
            <button type="button" aria-pressed={i === at} onClick={() => setAt(i)}>{step.name}</button>
          </li>
        ))}
      </ol>
      <p className={s.readout} aria-live="polite">{STEPS[at].text}</p>
    </>
  );
}

function Scale() {
  const [scale, setScale] = useState(3.3);
  const box = room.crops.print, low = Math.floor(scale), whole = scale === low;
  const crop = (k: number): CSSProperties => ({
    width: box.w * k,
    height: box.h * k,
    backgroundSize: `${room.w * k}px ${room.h * k}px`,
    backgroundPosition: `${-box.x * k}px ${-box.y * k}px`,
  });
  return (
    <>
      <div className={s.pair}>
        <div><span aria-hidden className={s.art} style={crop(scale)} /><span className="label">To fit: {scale.toFixed(1)}×</span></div>
        <div><span aria-hidden className={s.art} style={crop(low)} /><span className="label">Snapped: {low}×</span></div>
      </div>
      <label className={s.slider}>
        <span className="label">Scale</span>
        <input type="range" min={1} max={4} step={0.1} value={scale} onChange={e => setScale(Number(e.target.value))} />
      </label>
      <p className={s.readout} aria-live="polite">
        {whole
          ? `A whole step: every art pixel is exactly ${low}×${low} screen pixels, so the two match.`
          : `Art pixels cannot all be ${scale.toFixed(1)} wide, so some come out ${low} and others ${low + 1}. Compare the edges of the sword.`}
      </p>
    </>
  );
}

const COLOURS = [['Paper', 'paper'], ['Ink', 'ink'], ['Shadow', 'shadow'], ['Dusty blue', 'blue'], ['Sage', 'sage'], ['Warm amber', 'amber'], ['Night', 'night']];

function luminance(colour: string) {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(colour.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function Contrast() {
  const [ground, setGround] = useState('paper');
  const [light, setLight] = useState<Record<string, number>>({});

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setLight(Object.fromEntries(COLOURS.map(([, token]) => [token, luminance(style.getPropertyValue(`--c-${token}`).trim())])));
  }, []);

  const ratio = (token: string) => {
    const [hi, lo] = [light[token], light[ground]].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
  };
  return (
    <>
      <div className={s.switch} role="group" aria-label="Background">
        {['paper', 'night'].map(token => (
          <button key={token} type="button" aria-pressed={ground === token} onClick={() => setGround(token)}>On {token}</button>
        ))}
      </div>
      <ul className={s.swatches} style={{ background: `var(--c-${ground})` }}>
        {COLOURS.filter(([, token]) => token !== ground).map(([name, token]) => {
          const r = ratio(token);
          return (
            <li key={token} style={{ color: `var(--c-${token})` }}>
              <strong>Aa</strong>
              <span>{name}</span>
              <span>{r ? `${r.toFixed(2)} : 1` : '…'}</span>
              <span>{!r ? '' : r >= 4.5 ? 'body text' : r >= 3 ? 'large only' : 'decoration'}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

const SOUNDS: [Sfx, string][] = [
  ['click', 'Click'], ['floppy', 'Floppy'], ['crt', 'Monitor'], ['dial', 'Telephone'],
  ['page', 'Notebook'], ['blip', 'Dialogue'], ['meow', 'Meow'], ['purr', 'Purr'], ['chord', 'Rocky'], ['bump', 'Fist bump'],
];

function Sounds() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(soundWanted());
    const onSound = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    addEventListener(SOUND_EVENT, onSound);
    return () => removeEventListener(SOUND_EVENT, onSound);
  }, []);

  return (
    <>
      <div className={s.keys}>
        {SOUNDS.map(([name, label]) => <button key={name} type="button" className="btn" onClick={() => play(name)}>{label}</button>)}
      </div>
      <p className={s.readout} aria-live="polite">
        {on ? 'Ten effects. The rain behind them is the eleventh.' : 'Sound is switched off. Press M to turn it back on.'}
      </p>
    </>
  );
}

const FIGURES = { pipeline: Pipeline, scale: Scale, contrast: Contrast, sounds: Sounds };

export function Figure({ name, caption }: { name: FigureName; caption: string }) {
  const Body = FIGURES[name];
  return (
    <figure className={s.figure}>
      <div className={s.stage}><Body /></div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
