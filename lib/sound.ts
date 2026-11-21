// All sound is synthesised on demand. Sound is on by default and the radio in the room switches it.
// Browsers only allow audio after a click or key press, so "on" really starts at the first one.
export type Sfx = 'click' | 'floppy' | 'crt' | 'dial' | 'page' | 'blip' | 'meow' | 'purr';

const KEY = 'rahman:sound';
export const SOUND_EVENT = 'rahman:sound';

let ctx: AudioContext | undefined;
let on = false; // actually playing
let armed = false; // wanted, waiting for the first gesture
let stopRain: (() => void) | undefined;
const lastAt: Partial<Record<Sfx, number>> = {};

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return; // no Web Audio: the site stays silent and fully usable
    const a = (ctx = new AC());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) a.suspend();
      else if (on) a.resume();
    });
  }
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
  return ctx;
}

function noise(a: AudioContext, seconds: number) {
  const buffer = a.createBuffer(1, a.sampleRate * seconds, a.sampleRate), data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  return src;
}

function burst(a: AudioContext, t: number, freq: number, dur: number, vol: number, type: BiquadFilterType = 'bandpass') {
  const src = noise(a, dur), filter = a.createBiquadFilter(), gain = a.createGain();
  filter.type = type;
  filter.frequency.value = freq;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
  src.stop(t + dur);
}

function tone(a: AudioContext, t: number, from: number, to: number, dur: number, vol: number) {
  const osc = a.createOscillator(), gain = a.createGain();
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const FX: Record<Sfx, (a: AudioContext, t: number) => void> = {
  click: (a, t) => burst(a, t, 2400, 0.04, 0.25),
  floppy: (a, t) => { burst(a, t, 1800, 0.03, 0.2); burst(a, t + 0.09, 900, 0.06, 0.25); tone(a, t + 0.09, 110, 70, 0.12, 0.2); },
  crt: (a, t) => { tone(a, t, 60, 40, 0.25, 0.3); burst(a, t, 5000, 0.15, 0.06, 'highpass'); tone(a, t + 0.02, 9000, 9400, 0.5, 0.012); },
  // three touch-tone digits: each is a low and a high sine together
  dial: (a, t) => [[697, 1209], [770, 1336], [852, 1477]].forEach(([lo, hi], i) => { tone(a, t + i * 0.1, lo, lo, 0.08, 0.07); tone(a, t + i * 0.1, hi, hi, 0.08, 0.07); }),
  page: (a, t) => burst(a, t, 3200, 0.14, 0.14, 'highpass'),
  blip: (a, t) => tone(a, t, 720, 700, 0.03, 0.04),
  // A sawtooth voice through a band-pass "mouth" that opens and closes: mi-a-ow.
  meow: (a, t) => {
    const osc = a.createOscillator(), mouth = a.createBiquadFilter(), gain = a.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.linearRampToValueAtTime(820, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(430, t + 0.55);
    mouth.type = 'bandpass';
    mouth.Q.value = 3;
    mouth.frequency.setValueAtTime(900, t);
    mouth.frequency.linearRampToValueAtTime(2300, t + 0.18);
    mouth.frequency.exponentialRampToValueAtTime(800, t + 0.55);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.06);
    gain.gain.setValueAtTime(0.16, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(mouth).connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.62);
  },
  // Low rumble chopped 25 times a second, for as long as the purring animation runs.
  purr: (a, t) => {
    const src = noise(a, PURR_SECONDS), low = a.createBiquadFilter(), rattle = a.createGain(), chop = a.createOscillator(), depth = a.createGain(), fade = a.createGain();
    low.type = 'lowpass';
    low.frequency.value = 400;
    rattle.gain.value = 0.25;
    chop.type = 'sawtooth';
    chop.frequency.value = 25;
    depth.gain.value = 0.25;
    chop.connect(depth).connect(rattle.gain);
    fade.gain.setValueAtTime(0.001, t);
    fade.gain.linearRampToValueAtTime(1, t + 0.3);
    fade.gain.setValueAtTime(1, t + PURR_SECONDS - 0.6);
    fade.gain.linearRampToValueAtTime(0.001, t + PURR_SECONDS);
    src.connect(low).connect(rattle).connect(fade).connect(a.destination);
    src.start(t); chop.start(t);
    src.stop(t + PURR_SECONDS); chop.stop(t + PURR_SECONDS);
  },
};

export const PURR_SECONDS = 3.6;
// The shortest gap between two plays of the same sound.
const GAP: Partial<Record<Sfx, number>> = { meow: 1, purr: PURR_SECONDS };

// Rain sits at about a fifth of the effect level.
function rain(a: AudioContext) {
  const src = noise(a, 2), band = a.createBiquadFilter(), out = a.createGain(), lfo = a.createOscillator(), depth = a.createGain();
  src.loop = true;
  band.type = 'bandpass';
  band.frequency.value = 1800;
  band.Q.value = 0.4;
  out.gain.value = 0;
  out.gain.linearRampToValueAtTime(0.045, a.currentTime + 1.5);
  lfo.frequency.value = 0.13;
  depth.gain.value = 0.012;
  lfo.connect(depth).connect(out.gain);
  src.connect(band).connect(out).connect(a.destination);
  src.start();
  lfo.start();
  return () => {
    out.gain.cancelScheduledValues(a.currentTime);
    out.gain.setTargetAtTime(0, a.currentTime, 0.2);
    setTimeout(() => { src.stop(); lfo.stop(); }, 1500);
  };
}

// On unless the visitor has switched it off.
export function soundWanted() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setSound(next: boolean) {
  on = next;
  armed = false;
  try { localStorage.setItem(KEY, next ? 'on' : 'off'); } catch { /* private mode: preference just isn't kept */ }
  if (next) {
    const a = audio();
    if (a && !stopRain) stopRain = rain(a);
  } else {
    stopRain?.();
    stopRain = undefined;
  }
  dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: next }));
}

export function toggleSound() {
  setSound(!(on || armed));
}

// Call once per page load: starts the sound at the first click or key press, if it is wanted.
export function bootSound() {
  if (!soundWanted()) return;
  armed = true;
  const go = () => {
    removeEventListener('pointerdown', go);
    removeEventListener('keydown', go);
    if (armed) setSound(true);
  };
  addEventListener('pointerdown', go);
  addEventListener('keydown', go);
}

export function play(name: Sfx) {
  if (!on) return;
  const a = audio();
  if (!a || a.currentTime - (lastAt[name] ?? -9) < (GAP[name] ?? 0.12)) return; // no spam
  lastAt[name] = a.currentTime;
  FX[name](a, a.currentTime);
}
