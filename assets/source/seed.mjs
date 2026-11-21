// Seeds assets/source/room.aseprite. Run `bun run art:seed` ONLY to start over: it overwrites the
// Aseprite file, including anything redrawn by hand. Day to day, edit room.aseprite and run `bun run art`.
//
// Every pixel here is typed, not drawn. A pixel stores a material ramp and a level; a light map shifts
// the level and a narrow ordered dither picks the palette colour. The result is split into layers and
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { blit, png, writeAse } from './ase.mjs';

const W = 480, H = 270;
const F = 162; // y of the wall/floor line. Furniture against the wall: top-back edge = F - height.

const C = {
  n0: '#14171F', n1: '#1B202B', night: '#242A38', n3: '#323A4B', n4: '#434C5E', shadow: '#525761',
  b0: '#5A6C7E', blue: '#738A9B', bL: '#9DB1BE',
  m1: '#473B46', m2: '#634A47',
  w0: '#33262A', w1: '#4E3830', w2: '#74503C', w3: '#9C6B46', amber: '#C58A52', w5: '#E0AE74', w6: '#F1D3A0',
  sDD: '#414E47', sD: '#63735E', sage: '#8C9B7C', sL: '#B3C0A2',
  g1: '#7C7A70', g2: '#A6A08D', g3: '#CDC5AD', paper: '#F4EEDF', ink: '#292D32',
};

const RAMP = {
  wall: [C.n0, C.n1, C.night, C.n3, C.n4, C.shadow, C.blue, C.bL],
  wallWarm: [C.n0, C.n1, C.night, C.n3, C.m1, C.m2, C.w3, C.amber],
  floor: [C.n0, C.n1, C.w0, C.w1, C.w2, C.w3, C.amber],
  wood: [C.n1, C.w0, C.w1, C.w2, C.w3, C.amber, C.w5, C.w6],
  pale: [C.n3, C.n4, C.shadow, C.g1, C.g2, C.g3, C.paper],
  blue: [C.n1, C.night, C.n3, C.n4, C.b0, C.blue, C.bL],
  sage: [C.n1, C.sDD, C.sD, C.sage, C.sL, C.paper],
  metal: [C.n0, C.night, C.n4, C.shadow, C.blue, C.bL],
};

const LIGHTS = [
  { x: 180, y: 72, rx: 74, ry: 66, i: 2.6, warm: true }, // lamp on the wall
  { x: 184, y: 106, rx: 62, ry: 34, i: 1.6, warm: true }, // lamp pool on the desk
  { x: 270, y: 54, rx: 92, ry: 74, i: 1.1 }, // CRT halo
  { x: 266, y: 132, rx: 96, ry: 78, i: 1.3 }, // CRT spill on keyboard, chair, floor
  { x: 88, y: 128, rx: 112, ry: 92, i: 1.3 }, // window
];

const TAGS = ['', 'work', 'notes', 'about', 'contact', 'radio', 'cat'];
// Breathing room round each click target, in art pixels [top, right, bottom, left]. Kept tight so the
// label sits right under the object; the page widens small targets to a tappable size by itself.
const PAD = { work: [0, 0, 0, 0], notes: [1, 1, 1, 1], about: [1, 1, 1, 1], contact: [1, 1, 1, 1], radio: [1, 1, 1, 1], cat: [1, 1, 1, 1] };

let mat, lvl, tag, cur = 0, lit = true;
const reset = () => { mat = new Array(W * H).fill('wall'); lvl = new Float32Array(W * H); tag = new Uint8Array(W * H); };
const rnd = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;

function put(x, y, m, l = 0) {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = y * W + x;
  mat[i] = m; lvl[i] = l; tag[i] = cur;
}
function rect(x, y, w, h, m, l) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, m, l); }
function ell(cx, cy, rx, ry, m, l) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++)
    if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) put(x, y, m, l);
}
function shade(x, y, w, h, d) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
    if (i >= 0 && j >= 0 && i < W && j < H) lvl[j * W + i] += d;
}
function spr(x, y, rows, key) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (key[ch]) put(x + i, y + j, ...key[ch]); }));
}
function tagged(name, fn) { cur = TAGS.indexOf(name); fn(); cur = 0; }

const FONT = {
  R: ['##.', '#.#', '##.', '#.#', '#.#'], A: ['.#.', '#.#', '###', '#.#', '#.#'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
};
function text(x, y, str, m) {
  for (const ch of str) { spr(x, y, FONT[ch], { '#': [m] }); x += FONT[ch][0].length + 1; }
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
function colourAt(i, boost = 0) {
  const m = mat[i];
  if (m[0] === '#') return m;
  const x = i % W, y = (i / W) | 0, b = BAYER[(y & 3) * 4 + (x & 3)];
  let warm = 0, cool = 0;
  for (const L of lit ? LIGHTS : []) {
    const d = Math.hypot((x - L.x) / L.rx, (y - L.y) / L.ry);
    if (d < 1) { const v = L.i * (1 - d) ** 1.3; if (L.warm) warm += v; else cool += v; }
  }
  const ramp = m === 'wall' && warm - cool + (b - 0.5) * 0.3 > 0 ? RAMP.wallWarm : RAMP[m];
  // Dither only the middle fifth of each step, so bands stay clean with a short dithered edge.
  const L = lvl[i] + warm + cool + boost, base = Math.floor(L), t = (L - base - 0.4) / 0.2;
  return ramp[Math.max(0, Math.min(ramp.length - 1, base + (t > b ? 1 : 0)))];
}

const FACE = [
  '.....hhhhh.....',
  '...hhhhhhhhh...',
  '..hhhhhhhhhhh..',
  '.hhhHHhhhhhhhh.',
  '.hhHhhhhhhhhhh.',
  'hhhhhhhhhhhhhhh',
  'hhhssshhsssshhh',
  'hhssssssssssshh',
  'dsssssssssssssd',
  'dsseessssseessd',
  '.sssssssssssss.',
  '.ssssssnssssss.',
  '.sssssssssssss.',
  '..ssssmmmssss..',
  '..sssssssssss..',
  '...sssssssss...',
  '.....ddddd.....',
];
const FACE_KEY = { h: ['wall', 0], H: ['wall', 2], s: ['wood', 5.6], d: ['wood', 4.6], n: ['wood', 4.6], m: ['wood', 3.6], e: [C.w0] };
const turned = rows => [...rows[0]].map((_, c) => rows.map(r => r[c]).join(''));
// Fixed colours, shaded by hand, so the room's light map cannot dither the face away.
const CAT = [
  '....oo...........oo.....',
  '....obo.........obo.....',
  '....okbo.......obko.....',
  '....okkbooooooobkko.....',
  '....obbbblllllbbbbo.....',
  '...obbsbbblslbbbsbbo....',
  '...obbsbbbbsbbbbsbbo....',
  '...obbepebbbbbepebbo....',
  '...oblepelwwwlepelbo....',
  '.w.obllwwwwnwwwwllbo.w..',
  'w..obblwwwowowwwlbbo..w.',
  '....obbllwwwwwllbbo.....',
  '.....oobbwwwwwbboo......',
  '.....obbbwwWwwbbbo......',
  '....obsbbwwWwwbbsbo.....',
  '....obbsbwwWwwbsbbo.....',
  '...obbbbbbwWwbbbbbbo....',
  '...obsbbbbwwwbbbbsbo....',
  '..obbsbbbbbwbbbbbsbbo...',
  '..obbbsblllolllbsbbbo...',
  '..obbbbblllolllbbbbbo...',
  '..obsbbblllolllbbbsbo...',
  '..obbbbbwwwowwwbbbbbo...',
  '.ollsllsllsllsllsbbbbo..',
  '.obbsbbsbbsbbsbbsbbbbo..',
  '..oooooooooooooooooooo..',
];
const CAT_FLICK = [...CAT.slice(0, 21), 'ooobsbbblllolllbbbsbo...', 'olobbbbbwwwowwwbbbbbo...', 'obllsllsllsllsllsbbbbo..', ...CAT.slice(24)];
const CAT_HAPPY = [...CAT.slice(0, 7), '...obbbobbbbbbbobbbo....', '...oblobolwwwlobolbo....', ...CAT.slice(9)];
const HEART = ['.#.#.', '#####', '#####', '.###.', '..#..'];
const CAT_KEY = {
  o: [C.w1], b: [C.amber], l: [C.w5], s: [C.w3], w: [C.w6], W: [C.paper],
  e: [C.sL], p: [C.n0], n: [C.m2], k: [C.m2],
};
const CAT_AT = { x: 216, y: 165 };
const CAT_BOX = { x: CAT_AT.x - 2, y: CAT_AT.y - 17, w: 28, h: 45 }; // the cat, plus headroom for the hearts

const NOTE = ['.##', '.#.', '.#.', '##.', '##.'];
const Z = [['###', '.#.', '###'], ['###', '.#.', '###'], ['####', '..#.', '.#..', '####']];

function floppy(x, y, m, l) {
  shade(x + 1, y + 18, 17, 1, -1); shade(x + 17, y + 1, 1, 18, -1);
  rect(x, y, 17, 18, m, l); rect(x, y, 17, 1, m, l + 1);
  rect(x + 3, y + 1, 11, 8, 'pale', 5); rect(x + 5, y + 3, 7, 1, 'pale', 3); rect(x + 5, y + 5, 5, 1, 'pale', 3);
  rect(x + 4, y + 11, 9, 7, 'pale', 4); rect(x + 9, y + 12, 2, 5, m, l - 2);
}

// Fixed colours: the room's light map would dither a picture this small into mud.
function guts(x, y) {
  const key = {
    K: [C.n0], k: [C.n1], n: [C.night], a: [C.n3], A: [C.n4], c: [C.n0], // hair and collar, armour, cape
    s: [C.w5], d: [C.w3], r: [C.w1], e: [C.n0], w: [C.paper], // skin, scar and shut eye, open eye, white forelock
    m: [C.n4], M: [C.shadow], b: [C.w2], y: [C.amber], // iron arm, belt, buckle
  };
  rect(x, y, 42, 32, C.m2);

  const steel = [C.g3, C.g2, C.g2, C.g1, C.g1, C.g1, C.shadow, C.shadow];
  for (let i = 11; i < 42; i++) {
    const top = Math.round(10 + 0.67 * (i - 10)) - 4;
    steel.forEach((c, j) => { if (top + j < 32) put(x + i, y + top + j, c); });
  }
  for (let t = 0; t <= 10; t++) rect(x + Math.round(9.2 - 0.58 * t), y + Math.round(9.9 - 0.38 * t), 2, 2, t % 3 ? C.w0 : C.w2);
  rect(x + 2, y + 4, 3, 3, C.shadow);
  for (let t = 0; t <= 10; t++) rect(x + Math.round(7.5 + 0.5 * t), y + Math.round(14.2 - 0.74 * t), 2, 2, t < 2 || t > 8 ? C.shadow : C.n4);

  const left = [
    '.........KK.....',
    '.........KKK....',
    '........KnKK....',
    '.....aaaKnnKK.dd',
    '...aaAakKnnKKkkk',
    '..aaaakkkKKKkkkk',
    '..aaakkkkkkkkaak',
    '..akkkkkkkkkkaak',
    '..kkkkkkkkkkkkkk',
    '...kkkkkk.kkkkak',
    '..cckaak..kkkkkk',
    '..cckaak..kkkkaa',
    '.ccckaak..kkkkkk',
    '.ccckkkk..kkkkaa',
    '.ccckaak..kkkkkk',
    '.cccmmmk..bbbbbb',
    'cccc.mm...kkkbyy',
    'cccc......kkkkkk',
    'cccc......kkakkk',
    'cccc......kkakkk',
  ];
  spr(x + 5, y + 12, left.map((l, j) => {
    let r = [...l].reverse().join('').replace(/c/g, '.');
    if (j >= 10 && j <= 14) r = r.slice(0, 8) + r.slice(8).replace(/k/g, 'm').replace(/a/g, 'M');
    return l + r;
  }), key);

  spr(x + 15, y + 3, [
    '...K..K..K...',
    '..KK.KKK.KK..',
    '.KKKKKKKKKKK.',
    'KKKaKKKKaKKKK',
    'KKKKKwwKKKKK.',
    '.KKsKwsKsKK..',
    '.KsKKssKKdK..',
    '.KsrrssewdK..',
    '..sssrrsdd...',
    '..sssssssd...',
    '...ssrrsd....',
    '....sssd.....',
  ], key);
}

const SCREEN = { x: 238, y: 36, w: 64, h: 40 };
const GLASS = { x: 41, y: 25, w: 94, h: 72 };
const STEAM = { x: 199, y: 82, w: 12, h: 15 };
const PRINT = { x: 172, y: 3, w: 46, h: 36 };
const ZZZ = { x: 40, y: 119, w: 20, h: 26 };
const NOTES = { x: 459, y: 22, w: 17, h: 24 };
const CARET = { x: SCREEN.x + 43, y: SCREEN.y + 19, w: 2, h: 6 };

// Planks wrap at the canvas edge and the floor is exactly nine rows tall, so the floor tiles in both
// directions. The page uses that to carry the room on past the edges of the art.
function floor() {
  rect(0, F, W, H - F, 'floor', 3);
  const pr = rnd(11);
  for (let y = F; y < H; y += 12) {
    const joints = [];
    for (let x = Math.floor(pr() * 60); x < W - 40; x += 50 + Math.floor(pr() * 50)) joints.push(x);
    joints.forEach((x, k) => {
      const tint = [0, 0, 0, -0.5, 0.5][Math.floor(pr() * 5)], end = joints[k + 1] ?? joints[0] + W;
      for (let i = x; i < end; i++) shade(i % W, y, 1, 12, tint);
    });
    for (const x of joints) rect(x, y, 1, 12, 'floor', 2);
    rect(0, y, W, 1, 'floor', 2);
  }
}

function scene({ rain = 0, caret = 0, steam = 0, zzz = 0, cat = 0, purr = -1 } = {}, done = () => {}) {
  reset();
  const layer = (name, draw) => { draw(); done(name); };

  layer('shell', () => {
    rect(0, 0, W, F, 'wall', 2);
    rect(0, F - 6, W, 6, 'wall', 3); rect(0, F - 6, W, 1, 'wall', 4);
    floor();
  });

  layer('window', () => {
    const G = GLASS;
    rect(36, 20, 104, 82, 'pale', 3);
    rect(G.x, G.y, G.w, G.h, 'wall', 1);
    const wr = rnd(21);
    for (const [bx, bw, bh] of [[0, 14, 20], [14, 10, 33], [24, 18, 14], [42, 13, 40], [55, 15, 24], [70, 9, 31], [79, 15, 17]]) {
      rect(G.x + bx, G.y + G.h - bh, bw, bh, 'wall', 0);
      for (let k = 0; k < bw * bh / 26; k++)
        put(G.x + bx + 1 + Math.floor(wr() * (bw - 2)), G.y + G.h - bh + 2 + Math.floor(wr() * (bh - 3)), wr() < 0.5 ? C.w3 : C.amber);
    }
    const rr = rnd(3);
    for (let k = 0; k < 64; k++) {
      const x = G.x + Math.floor(rr() * G.w), y0 = Math.floor(rr() * G.h), len = 3 + Math.floor(rr() * 4), c = rr() < 0.35 ? C.blue : C.n4;
      for (let j = 0; j < len; j++) put(x, G.y + (y0 + j + rain * 12) % G.h, c);
    }
    rect(86, G.y, 5, G.h, 'pale', 3); rect(86, G.y, 1, G.h, 'pale', 4);
    shade(34, 107, 108, 3, -1);
    rect(32, 102, 112, 5, 'pale', 4); rect(32, 106, 112, 1, 'pale', 2);
    ell(109, 88, 7, 6, 'sage', 2); ell(105, 85, 4, 4, 'sage', 3); ell(114, 84, 4, 5, 'sage', 3); ell(109, 81, 2, 3, 'sage', 4);
    rect(104, 95, 10, 7, 'wood', 3); rect(103, 94, 12, 2, 'wood', 4);
    const fold = [2, 3, 3, 2, 1, 2, 3, 2, 2, 1];
    for (const [cx, cw] of [[17, 22], [139, 20]])
      for (let k = 0; k < cw; k++) rect(cx + k, 15, 1, 94 + (k * 7) % 3, 'sage', fold[k % fold.length]);
    rect(11, 12, 156, 2, 'metal', 3); rect(9, 11, 3, 4, 'metal', 4); rect(166, 11, 3, 4, 'metal', 4);
  });

  layer('print', () => {
    rect(PRINT.x, PRINT.y, PRINT.w, PRINT.h, 'wood', 3); rect(PRINT.x + 1, PRINT.y + 1, PRINT.w - 2, PRINT.h - 2, 'wood', 1);
    guts(PRINT.x + 2, PRINT.y + 2);
  });

  layer('pinboard and clock', () => {
    rect(330, 20, 54, 40, 'wood', 4); rect(332, 22, 50, 36, 'wood', 3);
    rect(336, 26, 10, 10, 'wood', 5); rect(350, 25, 12, 15, 'pale', 5);
    for (let y = 28; y < 38; y += 3) rect(352, y, 8, 1, 'pale', 3);
    rect(366, 28, 11, 9, 'sage', 3); rect(338, 40, 15, 13, 'pale', 6); rect(340, 42, 11, 7, 'blue', 3);
    rect(358, 43, 9, 9, 'wood', 6); rect(370, 42, 8, 11, 'pale', 4);
    for (const [x, y] of [[340, 27], [355, 26], [371, 29], [345, 41], [362, 44], [373, 43]]) put(x, y, C.amber);
    ell(430, 20, 9, 9, 'wood', 3); ell(430, 20, 7, 7, 'pale', 5);
    rect(430, 15, 1, 6, C.ink); rect(430, 20, 4, 1, C.ink);
  });

  layer('bed', () => {
    rect(6, 216, 134, 12, 'floor', 0);
    rect(0, 104, 6, 124, 'wood', 2); rect(0, 104, 6, 1, 'wood', 4); rect(5, 105, 1, 123, 'wood', 1);
    rect(6, 120, 140, 66, 'pale', 4);
    rect(6, 186, 140, 22, 'pale', 3); rect(6, 186, 140, 1, 'pale', 5);
    rect(6, 208, 140, 9, 'wood', 2); rect(6, 208, 140, 1, 'wood', 3); rect(140, 217, 6, 11, 'wood', 1);
    shade(6, 228, 140, 3, -1);
    shade(11, 169, 34, 1, -1);
    rect(11, 137, 34, 32, 'pale', 5); rect(10, 138, 36, 30, 'pale', 5); rect(11, 168, 34, 1, 'pale', 4);
    rect(48, 120, 98, 66, 'sage', 3);
    rect(48, 120, 8, 66, 'pale', 5); rect(55, 120, 1, 66, 'pale', 3); // the sheet folded back over it
    for (let x = 48; x < 146; x++) rect(x, 186, 1, 18 + Math.round(2 * Math.sin(x / 6)), 'sage', 2);
    rect(48, 186, 98, 1, 'sage', 4);
  });

  layer('person', () => {
    const half = x => x < 64 ? 12 : x < 98 ? 12 - (x - 64) / 34 * 3 : x < 130 ? 9 - (x - 98) / 32 * 2 : 7 - (x - 130) * 0.9;
    for (let x = 56; x < 137; x++) {
      const h = Math.round(half(x)), top = 153 - h, low = 153 + h;
      rect(x, top, 1, 2, 'sage', 3.5);
      rect(x, low - 3, 1, 3, 'sage', 2.5);
      rect(x, low, 1, 2, 'sage', 2);
    }
    rect(100, 153, 26, 1, 'sage', 2.5); // the dip between the legs
    for (const y of [148, 158]) { ell(132, y, 4.5, 4, 'sage', 3.5); rect(128, y + 4, 9, 2, 'sage', 2); } // feet
    for (const [x, y, n] of [[70, 146, 9], [84, 160, 7], [112, 148, 8]]) for (let k = 0; k < n; k++) put(x + k, y + Math.floor(k / 3), 'sage', 2.5);

    rect(42, 142, 6, 22, 'blue', 4); rect(41, 144, 1, 18, 'blue', 4); rect(42, 163, 6, 1, 'blue', 3);
    rect(39, 150, 3, 7, 'wood', 4.6);
    shade(25, 161, 14, 1, -1);
    spr(24, 146, turned(FACE), FACE_KEY);

    rect(48, 168, 34, 1, 'sage', 2);
    rect(46, 162, 12, 6, 'blue', 4); rect(46, 167, 12, 1, 'blue', 3);
    rect(58, 163, 18, 4, 'wood', 5.6); rect(58, 166, 18, 1, 'wood', 4.6);
    rect(76, 162, 6, 5, 'wood', 5.6); rect(76, 166, 6, 1, 'wood', 4.6); put(81, 162, 'sage', 3);

    [[42, 139], [47, 131], [53, 121]].slice(0, zzz).forEach(([x, y], k) => spr(x, y, Z[k], { '#': [C.n4] }));
  });

  layer('floor things', () => {
    rect(152, 212, 252, 48, 'blue', 2); rect(155, 215, 246, 42, 'blue', 3); rect(157, 217, 242, 38, 'blue', 2);
    for (let cx = 178; cx < 390; cx += 40) for (let d = -4; d <= 4; d++) rect(cx - (4 - Math.abs(d)), 236 + d, 2 * (4 - Math.abs(d)) + 1, 1, 'wood', 3);
    for (let y = 213; y < 260; y += 2) { rect(150, y, 2, 1, 'pale', 3); rect(404, y, 2, 1, 'pale', 3); }
  });

  layer('bookshelf', () => {
    const SX = 392, SW = 70;
    shade(SX, 182, SW, 4, -1);
    rect(SX, 47, SW, 20, 'wood', 3);
    rect(SX, 67, SW, 115, 'wood', 2); rect(SX, 67, SW, 1, 'wood', 4);
    const br = rnd(5), spines = [['wood', 4], ['wood', 5], ['sage', 2], ['sage', 3], ['blue', 3], ['blue', 5], ['pale', 4], ['pale', 5], ['wall', 5]];
    for (let k = 0; k < 3; k++) {
      const top = 72 + k * 37, base = top + 32;
      rect(SX + 4, top, SW - 8, 32, 'wood', 0);
      for (let x = SX + 5; x < SX + SW - 11;) {
        if (br() < 0.12) { x += 5; continue; }
        const w = 3 + Math.floor(br() * 5), h = 19 + Math.floor(br() * 10), [m, l] = spines[Math.floor(br() * spines.length)];
        rect(x, base - h, w, h, m, l); rect(x, base - h + 3, w, 1, m, l + 1); rect(x + w - 1, base - h, 1, h, m, l - 1);
        x += w;
      }
    }
    rect(404, 50, 12, 10, 'wood', 4); rect(403, 49, 14, 2, 'wood', 5);
    ell(410, 43, 9, 7, 'sage', 2); ell(405, 40, 5, 5, 'sage', 3); ell(415, 39, 5, 5, 'sage', 3); ell(410, 36, 3, 3, 'sage', 4);
    for (let k = 0; k < 9; k++) { const y = 52 + k * 6, x = 396 + (k % 2); rect(x, y, 1, 6, 'sage', 2); rect(x + (k % 2 ? 1 : -2), y + 2, 2, 2, 'sage', 3); }
  });

  layer('radio', () => {
    tagged('radio', () => {
      rect(432, 46, 24, 7, 'pale', 3); rect(432, 53, 24, 11, 'pale', 2); rect(432, 53, 24, 1, 'pale', 4);
      ell(439, 59, 4, 4, 'pale', 0); rect(446, 56, 8, 2, C.w5); put(447, 61, 'pale', 4); put(451, 61, 'pale', 4);
      for (let k = 0; k < 14; k++) put(454 + k / 4, 46 - k, 'metal', 4);
    });
    [[], [[461, 39]], [[462, 33], [468, 40]], [[464, 26], [470, 34]]][zzz].forEach(([x, y]) => spr(x, y, NOTE, { '#': [C.w5] }));
  });

  layer('desk', () => {
    const DX = 158, DW = 214;
    shade(DX, 206, DW, 5, -1);
    rect(DX, 84, DW, 44, 'wood', 3);
    for (const [x, y, w] of [[164, 91, 40], [330, 95, 36], [170, 119, 30], [312, 121, 50]]) rect(x, y, w, 1, 'wood', 2.5);
    rect(DX, 128, DW, 3, 'wood', 4);
    rect(DX, 131, DW, 75, 'wood', 2);
    rect(166, 131, 131, F - 131, 'wall', 0); rect(166, F - 6, 131, 1, 'wall', 1); rect(166, F, 131, 206 - F, 'floor', 1);
    for (let y = F + 12; y < 206; y += 12) rect(166, y, 131, 1, 'floor', 0);
    rect(264, 158, 28, 10, 'wood', 2); rect(264, 168, 28, 26, 'wood', 1); rect(277, 158, 2, 10, 'wood', 1); shade(264, 194, 28, 2, -1);
    for (let y = 131; y < 178; y++) { put(246 + Math.round(Math.sin(y / 9) * 2), y, 'metal', 1); put(252 + Math.round(Math.sin(y / 7 + 2) * 2), y, 'metal', 1); }
    rect(296, 131, 1, 75, 'wood', 1);
    for (let k = 0; k < 3; k++) {
      const y = 135 + k * 23;
      rect(301, y, 66, 20, 'wood', 3); rect(301, y + 19, 66, 1, 'wood', 1); rect(328, y + 8, 12, 2, 'metal', 4);
    }
  });

  layer('lamp and mug', () => {
    ell(180, 96, 10, 4.5, 'metal', 2); ell(180, 95, 10, 4.5, 'metal', 3);
    rect(179, 58, 2, 37, 'metal', 3);
    for (let k = 0; k < 16; k++) { const w = 14 + k; rect(180 - (w >> 1), 42 + k, w, 1, 'sage', 2); rect(180 - (w >> 1) + 2, 42 + k, 3, 1, 'sage', 3); }
    rect(166, 58, 29, 2, C.w6);
    rect(199, 99, 11, 11, 'pale', 4); rect(200, 110, 9, 1, 'pale', 3); rect(210, 101, 2, 6, 'pale', 4); put(210, 103, 'wood', 3); put(210, 104, 'wood', 3);
    ell(204.5, 99, 5.5, 2.5, 'pale', 6); ell(204.5, 99, 4, 1.5, C.w0);
    for (let k = 0; k < 6; k++) put(204 + Math.round(Math.sin((k + steam) * 1.6) * 1.5), 94 - k * 2 - (steam % 2), k < 3 ? C.shadow : C.n4);
  });

  layer('computer', () => tagged('work', () => {
    rect(218, 68, 104, 22, 'pale', 4);
    rect(218, 90, 104, 16, 'pale', 3); rect(218, 90, 104, 1, 'pale', 5);
    rect(280, 95, 28, 3, C.n0); rect(280, 98, 28, 1, 'pale', 5); rect(310, 99, 3, 2, 'pale', 1);
    rect(232, 97, 5, 4, 'pale', 5); rect(226, 98, 2, 2, C.sL);
    for (let x = 242; x < 272; x += 3) rect(x, 95, 1, 7, 'pale', 2);
    rect(246, 86, 48, 3, 'pale', 1);
    rect(228, 12, 84, 16, 'pale', 4);
    for (let x = 238; x < 304; x += 4) rect(x, 15, 2, 8, 'pale', 3);
    rect(228, 28, 84, 58, 'pale', 3); rect(228, 28, 84, 1, 'pale', 5); rect(228, 85, 84, 1, 'pale', 2);
    rect(234, 32, 72, 48, 'pale', 1);
    rect(240, 81, 10, 2, 'pale', 5);
    for (let k = 0; k < 4; k++) rect(282 + k * 4, 81, 2, 2, 'pale', 1);
    rect(300, 81, 2, 2, C.sL);
    rect(229, 62, 6, 7, 'wood', 5); rect(229, 62, 6, 1, 'wood', 4);

    const S = SCREEN;
    rect(S.x, S.y, S.w, S.h, C.paper);
    for (const [x, y] of [[0, 0], [S.w - 1, 0], [0, S.h - 1], [S.w - 1, S.h - 1]]) put(S.x + x, S.y + y, 'pale', 1);
    rect(S.x + 1, S.y + 1, S.w - 2, 7, C.blue);
    text(S.x + 3, S.y + 2, 'RAHMAN', C.paper);
    for (const dx of [52, 55, 58]) rect(S.x + dx, S.y + 3, 2, 2, C.paper);
    rect(S.x + 2, S.y + 17, S.w - 4, 9, C.w6);
    [[C.amber, [8, 12, 5]], [C.night, [10, 6, 9, 4]], [C.sage, [6, 11]]].forEach(([icon, words], k) => {
      const y = S.y + 11 + k * 9;
      rect(S.x + 4, y, 5, 5, icon);
      let x = S.x + 12;
      for (const w of words) { rect(x, y + 1, w, 3, C.shadow); x += w + 2; }
    });
    if (!caret) rect(CARET.x, CARET.y, 1, 6, C.ink);

    rect(224, 110, 78, 12, 'pale', 4); rect(224, 122, 78, 2, 'pale', 2);
    rect(226, 112, 74, 8, 'pale', 3);
    for (const ky of [112, 115, 118]) for (let kx = 227; kx < 299; kx += 3) rect(kx, ky, 2, 2, 'pale', 5);
    rect(246, 118, 30, 2, 'pale', 5);
    rect(310, 106, 1, 6, 'metal', 1);
    ell(310.5, 117, 4, 5.5, 'pale', 5); rect(310, 112, 1, 4, 'pale', 3);
  }));

  layer('floppies', () => tagged('notes', () => { floppy(178, 103, 'wood', 5); floppy(170, 108, 'blue', 4); }));

  layer('notebook and photo', () => tagged('about', () => {
    rect(352, 68, 17, 20, 'wood', 4); rect(354, 70, 13, 16, 'pale', 6); rect(355, 71, 11, 10, 'blue', 2);
    ell(362, 75, 2, 2, 'wood', 6); rect(355, 79, 11, 2, 'sage', 1);
    shade(330, 111, 40, 1, -1);
    rect(329, 90, 40, 21, 'wood', 2); rect(330, 90, 38, 20, 'pale', 5); rect(349, 90, 1, 20, 'pale', 3);
    for (let k = 0; k < 6; k++) { rect(333, 93 + k * 3, 9 + (k * 5) % 6, 1, 'pale', 3); if (k < 4) rect(352, 93 + k * 3, 8 + (k * 3) % 7, 1, 'pale', 3); }
    for (let k = 0; k < 10; k++) put(353 + k, 108 - Math.floor(k / 2), 'wood', k < 2 ? 1 : 5);
  }));

  layer('telephone', () => tagged('contact', () => {
    shade(335, 127, 34, 1, -1);
    rect(334, 113, 34, 10, 'sage', 3); rect(334, 123, 34, 4, 'sage', 2);
    rect(336, 114, 30, 3, 'sage', 4); rect(332, 112, 7, 6, 'sage', 4); rect(363, 112, 7, 6, 'sage', 4);
    for (const y of [118, 120, 122]) for (const x of [347, 350, 353]) put(x, y, 'pale', 6);
    for (let k = 0; k < 5; k++) put(330 - (k % 2), 118 + k * 2, 'sage', 1);
  }));

  layer('chair', () => {
    for (let x = 200; x < 257; x++) for (let y = 216; y < 228; y++) if (((x - 228) / 28) ** 2 + ((y - 222) / 6) ** 2 <= 1) shade(x, y, 1, 1, -1);
    rect(207, 216, 43, 3, 'metal', 2); rect(205, 218, 5, 4, 'metal', 1); rect(246, 218, 5, 4, 'metal', 1); rect(226, 219, 5, 5, 'metal', 1);
    rect(226, 196, 4, 21, 'metal', 2);
    rect(207, 132, 43, 40, 'blue', 3); rect(206, 134, 45, 36, 'blue', 3); rect(210, 135, 37, 33, 'blue', 4);
    rect(203, 171, 51, 21, 'blue', 4); rect(202, 173, 53, 17, 'blue', 4); rect(203, 171, 51, 1, 'blue', 2);
    rect(203, 192, 51, 4, 'blue', 2);
  });

  layer('cat', () => tagged('cat', () => {
    const { x, y } = CAT_AT;
    shade(x + 1, y + 26, 21, 2, -1);
    if (purr < 0) return spr(x, y, cat ? CAT_FLICK : CAT, CAT_KEY);
    spr(x, y + 13, CAT_HAPPY.slice(13), CAT_KEY);
    spr(x, y + purr % 2, CAT_HAPPY.slice(0, 13), CAT_KEY);
    for (const [hx, phase] of [[18, 0], [0, 6]]) {
      const up = (purr + phase) % 12;
      if (up < 10) spr(x + hx, y - 6 - up, HEART, { '#': [up > 7 ? C.w3 : C.amber] });
    }
  }));
}

const OUT = 'assets/source/room.aseprite';
if (existsSync(OUT) && !process.argv.includes('--force')) {
  console.error(`${OUT} already exists. Seeding would overwrite anything drawn by hand.\nRun "bun run art:seed -- --force" if that is really what you want.`);
  process.exit(1);
}

const rgb = Object.fromEntries(Object.values(C).map(h => [h, [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))]));
function render(pick = i => colourAt(i)) {
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { const c = pick(i); if (c) { out.set(rgb[c], i * 4); out[i * 4 + 3] = 255; } }
  return out;
}
function cel(layer, rgba) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < W * H; i++) if (rgba[i * 4 + 3]) { x0 = Math.min(x0, i % W); x1 = Math.max(x1, i % W); y0 = Math.min(y0, (i / W) | 0); y1 = Math.max(y1, (i / W) | 0); }
  if (x1 < 0) return;
  const box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }, out = Buffer.alloc(box.w * box.h * 4);
  blit(rgba, W, box, out, box.w);
  return { layer, ...box, rgba: out };
}
const same = (a, b) => a && b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h && a.rgba.equals(b.rgba);

const FRAMES = 12, layers = [], frames = [], purring = [];
let hover, slices;
for (let f = 0; f < FRAMES; f++) {
  const cels = [];
  let prev, n = 0;
  scene({ rain: f % 6, steam: Math.floor(f / 3) % 4, zzz: Math.floor(f / 3) % 4, caret: f < 6 ? 0 : 1, cat: f < 8 ? 0 : 1 }, name => {
    const now = render(), diff = Buffer.alloc(now.length);
    for (let i = 0; i < now.length; i += 4) if (!prev || now.readUInt32LE(i) !== prev.readUInt32LE(i)) now.copy(diff, i, i, i + 4);
    prev = now;
    if (!f) layers.push({ name });
    const c = cel(n++, diff);
    if (c) cels.push(same(c, frames[0]?.cels.find(o => o.layer === c.layer)) ? { layer: c.layer, link: 0 } : c);
  });
  if (!f) {
    const near = i => [i - 1, i + 1, i - W, i + W].some(k => k >= 0 && k < W * H && tag[k]);
    hover = cel(0, render(i => tag[i] ? (mat[i][0] === '#' ? null : colourAt(i, 1)) : near(i) ? C.paper : null));
    slices = { 'loop/rain': GLASS, 'loop/steam': STEAM, 'loop/caret': CARET, 'loop/zzz': ZZZ, 'loop/notes': NOTES, 'loop/tail': { x: CAT_AT.x, y: CAT_AT.y + 20, w: 24, h: 6 }, 'crop/print': PRINT };
    TAGS.slice(1).forEach((name, t) => {
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let i = 0; i < W * H; i++) if (tag[i] === t + 1) { x0 = Math.min(x0, i % W); x1 = Math.max(x1, i % W); y0 = Math.min(y0, (i / W) | 0); y1 = Math.max(y1, (i / W) | 0); }
      const [pt, pr, pb, pl] = PAD[name].map(p => p + 1); // +1 for the outline
      slices[name] = { x: x0 - pl, y: y0 - pt, w: x1 - x0 + 1 + pl + pr, h: y1 - y0 + 1 + pt + pb };
    });
    slices.cat = CAT_BOX;
  }
  prev = undefined;
  scene({ purr: f }, name => {
    const now = render();
    if (name === 'cat') {
      const diff = Buffer.alloc(now.length);
      for (let i = 0; i < now.length; i += 4) if (now.readUInt32LE(i) !== prev.readUInt32LE(i)) now.copy(diff, i, i, i + 4);
      purring.push(cel(0, diff));
    }
    prev = now;
  });
  frames.push({ ms: 100, cels });
}

// Hidden layers the site needs: the purring cat (swapped in for the "cat" layer when it is clicked),
{
  const layer = layers.push({ name: 'alt/cat', visible: false }) - 1;
  frames.forEach((fr, f) => fr.cels.push({ ...purring[f], layer }));
}
reset(); lit = false; floor();
const tile = cel(0, render(i => i >= F * W ? colourAt(i) : null));
lit = true;
[['hover', hover], ['floor tile', tile]].forEach(([name, c]) => {
  const layer = layers.push({ name, visible: false }) - 1;
  frames.forEach((fr, f) => fr.cels.push(f ? { layer, link: 0 } : { ...c, layer }));
});

writeFileSync(OUT, writeAse({ width: W, height: H, palette: Object.values(rgb), layers, frames, tags: [{ name: 'loop', from: 0, to: FRAMES - 1 }], slices }));

// Favicon: one floppy, drawn where no light reaches. Not part of the Aseprite file.
reset();
rect(440, 240, 24, 24, 'wall', 2);
floppy(443, 243, 'blue', 5);
const icon = Buffer.alloc(96 * 96 * 4);
blit(render(), W, { x: 440, y: 240, w: 24, h: 24 }, icon, 96, 0, 0, 4);
mkdirSync('app', { recursive: true });
writeFileSync('app/icon.png', png(96, 96, icon));

console.log(`seeded ${OUT}: ${layers.length} layers, ${FRAMES} frames, ${Object.keys(slices).length} slices`);
