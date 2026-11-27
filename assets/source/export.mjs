// `bun run art`: builds everything the site needs from assets/source/room.aseprite.
// Draw in Aseprite, save, run this. It reads the .aseprite file directly, so the Aseprite CLI is not needed.
//
// What it expects in the file (all editable in Aseprite):
//   - a hidden layer "hover": the outlines shown when an object is hovered or focused
//   - a hidden layer "floor tile": bare floor, tiled by the page past the edges of the art
//   - a right-hand pixel column with nothing but wall and floor in it (the page repeats it sideways)
//   - slices "work", "notes", "about", "contact", "radio", "cat": the click targets
//   - a hidden layer "alt/<name>": what the layer <name> looks like after it is clicked, exported over
//     the slice <name> (the cat purring)
//   - slices "loop/<name>": regions that animate (every frame of the file is one step of the loop)
//   - slices "crop/<name>": regions a page shows on its own
//   - hidden layers "actor/<name>/<pose>": a character that moves about the room, one layer per pose,
//     each exported on its own with no room behind it, from the slice "actor/<name>" (whose bottom edge
//     is the ground under its feet). Slices "stop/<name>/<place>" are places it goes: the middle of the
//     slice's bottom edge is where its feet land
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { blit, flatten, png, readAse } from './ase.mjs';

const ase = readAse(readFileSync('assets/source/room.aseprite'));
const { width: W, height: H, frames, slices } = ase;
const layer = name => {
  if (!ase.layers.some(l => l.name === name)) throw new Error(`room.aseprite has no layer named "${name}".`);
  return flatten(ase, 0, l => l.name === name);
};
const out = (file, w, h, rgba) => writeFileSync(`public/art/${file}`, png(w, h, rgba));
mkdirSync('public/art', { recursive: true });

const shots = frames.map((_, f) => flatten(ase, f));
out('room.png', W, H, shots[0]);
out('room-hi.png', W, H, layer('hover'));

const floor = layer('floor tile');
let top = 0, bottom = H;
while (top < H && !floor[top * W * 4 + 3]) top++;
while (bottom > top && !floor[(bottom - 1) * W * 4 + 3]) bottom--;
const tile = Buffer.alloc(W * (bottom - top) * 4);
blit(floor, W, { x: 0, y: top, w: W, h: bottom - top }, tile, W);
out('floor.png', W, bottom - top, tile);

const wall = Buffer.alloc(top * 4);
blit(shots[0], W, { x: W - 1, y: 0, w: 1, h: top }, wall, 1);
out('wall.png', 1, top, wall);

const hotspots = {}, crops = {}, loops = [];
for (const [name, box] of Object.entries(slices)) {
  if (name.startsWith('actor/') || name.startsWith('stop/')) continue;
  if (name.startsWith('crop/')) crops[name.slice(5)] = box;
  else if (name.startsWith('loop/')) {
    const strip = Buffer.alloc(box.w * frames.length * box.h * 4);
    shots.forEach((shot, f) => blit(shot, W, box, strip, box.w * frames.length, box.w * f));
    out(`${name.slice(5)}.png`, box.w * frames.length, box.h, strip);
    loops.push({ name: name.slice(5), ...box });
  } else hotspots[name] = box;
}
for (const need of ['work', 'notes', 'about', 'contact', 'radio', 'cat']) if (!hotspots[need]) throw new Error(`room.aseprite has no slice named "${need}".`);

for (const alt of ase.layers.filter(l => l.name.startsWith('alt/'))) {
  const name = alt.name.slice(4), box = hotspots[name];
  if (!box) throw new Error(`Layer "${alt.name}" needs a slice named "${name}".`);
  const strip = Buffer.alloc(box.w * frames.length * box.h * 4);
  frames.forEach((_, f) => blit(flatten(ase, f, l => l === alt || (l.shown && l.name !== name)), W, box, strip, box.w * frames.length, box.w * f));
  out(`${name}-alt.png`, box.w * frames.length, box.h, strip);
}

const actors = {};
for (const [slice, box] of Object.entries(slices)) {
  if (!slice.startsWith('actor/')) continue;
  const name = slice.slice(6), poses = ase.layers.filter(l => l.name.startsWith(`${slice}/`)), stops = {};
  for (const layer of poses) {
    const strip = Buffer.alloc(box.w * frames.length * box.h * 4);
    frames.forEach((_, f) => blit(flatten(ase, f, l => l === layer), W, box, strip, box.w * frames.length, box.w * f));
    out(`${name}-${layer.name.slice(slice.length + 1)}.png`, box.w * frames.length, box.h, strip);
  }
  for (const [key, at] of Object.entries(slices)) if (key.startsWith(`stop/${name}/`)) stops[key.split('/')[2]] = { x: at.x + at.w / 2, y: at.y + at.h };
  actors[name] = { w: box.w, h: box.h, stops };
}

const og = Buffer.alloc(1200 * 630 * 4);
for (let i = 0; i < 1200 * 630; i++) og.set([0x24, 0x2a, 0x38, 255], i * 4);
blit(shots[0], W, { x: 0, y: 0, w: W, h: H }, og, 1200, 120, 45, 2);
out('og.png', 1200, 630, og);

writeFileSync('components/room/room.json', JSON.stringify({
  w: W, h: H, frames: frames.length, ms: frames.reduce((sum, f) => sum + f.ms, 0),
  floor: { y: top, h: bottom - top }, wall: '#' + shots[0].subarray((W - 1) * 4, (W - 1) * 4 + 3).toString('hex'), hotspots, loops, actors, crops,
}, null, 2) + '\n');

if (process.env.ZOOM) {
  const [x, y, w, h, s] = process.env.ZOOM.split(',').map(Number), zoom = Buffer.alloc(w * s * h * s * 4);
  blit(shots[0], W, { x, y, w, h }, zoom, w * s, 0, 0, s);
  writeFileSync('zoom.png', png(w * s, h * s, zoom));
}
console.log(`exported ${ase.layers.length} layers, ${frames.length} frames: ${Object.keys(hotspots).length} hotspots, ${loops.length} loops`);
