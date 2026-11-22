import type { Block } from './blocks';

export type Note = { slug: string; title: string; tag: string; date: string; summary: string; body: Block[] };

export const notes: Note[] = [
  {
    slug: 'square-pixels',
    tag: 'CSS',
    title: 'Keeping pixels square',
    date: '2026-11-21',
    summary: 'Why the room fills the screen without ever scaling to fit.',
    body: [
      'The room is drawn at 480×270. Scale it by 3 and every art pixel becomes a clean 3×3 block. Scale it by 3.3 to fill a laptop screen exactly, and some columns come out four screen pixels wide and others three. The window frame shimmers whenever anything moves.',
      { figure: 'scale', caption: 'The print above the lamp at any scale, beside the same print snapped down to a whole step. Drag the slider.' },
      'So the room never scales to fit. Its height is round(down, 100cqh, 270px): the largest whole multiple of 270px the screen allows. On screens with two or three device pixels per CSS pixel, halves and thirds are safe too, so the step shrinks to 135px or 90px.',
      { code: `.scene {
  --rh: max(270px, min(
    round(down, 100cqh, var(--sy)),
    round(down, var(--wide), var(--sx)) * 9 / 16));
}`, caption: 'The rule that sizes the room. --sy and --sx are one whole step of scale: 270px and 480px, halved or cut in three on sharper screens.' },
      'That leaves gaps, and the gaps are filled with more room. The wall’s edge column repeats sideways. The floor is a tile whose planks wrap around, so it carries on left, right and down without a seam. The art stays the same size; the room around it grows.',
      'On a phone held upright the room is wider than the screen, so it scrolls sideways and starts centred on the desk. Offsets are rounded to whole pixels as well: half a pixel of offset brings the blur straight back.',
      'Known gap: at a device pixel ratio of 1.25 or 1.5, common on Windows laptops, no CSS size lands on whole device pixels. This site leaves that alone.',
    ],
  },
  {
    slug: 'contrast',
    tag: 'Design',
    title: 'The palette failed its own contrast test',
    date: '2026-11-21',
    summary: 'Two of seven colours could not be used for text.',
    body: [
      'The palette began as seven colours: paper, ink, shadow, dusty blue, sage, warm amber and night. Before anything was drawn, each was measured as text on the two backgrounds.',
      'On paper, ink scores 11.97 to 1 and shadow 6.27. Dusty blue manages 3.11, enough for large text only. Sage and amber score 2.56 and 2.54, which is decoration, not text.',
      { figure: 'contrast', caption: 'The seven colours as text, measured live. Switch the background.' },
      'On night the picture flips. Amber reaches 4.87 and sage 4.85, both fine for body text. Shadow drops to 1.98.',
      'So the accent changes with the background. Night pages use the original amber. Paper pages use a darker one, #8A5A2B, at 5.07 to 1. The pretty amber still appears on paper, but only as a fill.',
    ],
  },
  {
    slug: 'no-audio-files',
    tag: 'Audio',
    title: 'Nine sounds, no audio files',
    date: '2026-11-21',
    summary: 'Every sound on this site is synthesised when it plays.',
    body: [
      'The click is 40 milliseconds of white noise through a band-pass filter at 2.4 kHz. The floppy is two of those plus a 110 Hz thump. The monitor is a 60 Hz thud, a short hiss and a faint high whine that fades over half a second. The telephone dials three touch-tone digits, each a low and a high sine wave together. The notebook is a puff of high-passed noise, and the dialogue box ticks with a 30 millisecond tone.',
      { figure: 'sounds', caption: 'Every effect on the site. Nothing is downloaded when you press one.' },
      'The cat has two. Its meow is a sawtooth that slides from 520 Hz up to 820 and back down, pushed through a band-pass filter that opens and closes like a mouth. Its purr is low rumble chopped 25 times a second.',
      { code: `osc.type = 'sawtooth';
osc.frequency.setValueAtTime(520, t);
osc.frequency.linearRampToValueAtTime(820, t + 0.12);
osc.frequency.exponentialRampToValueAtTime(430, t + 0.55);`, caption: 'The pitch of the meow: up for an eighth of a second, then a long slide down.' },
      'The rain is looped noise, band-passed around 1.8 kHz, with a slow wobble on the volume. It sits at about a fifth of the level of the effects, and everything pauses when the tab is hidden.',
      'There is nothing to license and nothing to download. Sound is on by default, but browsers only allow audio after a click or a key press, so the rain starts with your first one. The radio on the shelf switches it off.',
      'The trade-off: synthesised rain sounds like rain heard through a wall. For this room, that is close enough.',
    ],
  },
];
