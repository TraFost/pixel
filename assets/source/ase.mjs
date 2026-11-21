// Minimal Aseprite file reader/writer and PNG writer. RGB colour mode, normal blending only.
// Format reference: https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md
import { crc32, deflateSync, inflateSync } from 'node:zlib';

const str = s => { const b = Buffer.from(s, 'utf8'), out = Buffer.alloc(2 + b.length); out.writeUInt16LE(b.length); b.copy(out, 2); return out; };
const chunk = (type, data) => { const out = Buffer.alloc(6 + data.length); out.writeUInt32LE(out.length); out.writeUInt16LE(type, 4); data.copy(out, 6); return out; };

export function writeAse({ width, height, palette, layers, frames, tags = [], slices = {} }) {
  const first = [];
  { const b = Buffer.alloc(16); b.writeUInt16LE(1); first.push(chunk(0x2007, b)); } // colour profile: sRGB
  {
    const b = Buffer.alloc(20 + palette.length * 6);
    b.writeUInt32LE(palette.length); b.writeUInt32LE(palette.length - 1, 8);
    palette.forEach((rgb, i) => { b.set([...rgb, 255], 22 + i * 6); });
    first.push(chunk(0x2019, b));
  }
  if (tags.length) {
    const parts = [Buffer.alloc(10)];
    parts[0].writeUInt16LE(tags.length);
    for (const t of tags) { const b = Buffer.alloc(17); b.writeUInt16LE(t.from); b.writeUInt16LE(t.to, 2); parts.push(b, str(t.name)); }
    first.push(chunk(0x2018, Buffer.concat(parts)));
  }
  for (const l of layers) {
    const b = Buffer.alloc(16);
    b.writeUInt16LE((l.visible === false ? 0 : 1) | 2); b[12] = 255;
    first.push(chunk(0x2004, Buffer.concat([b, str(l.name)])));
  }
  for (const [name, s] of Object.entries(slices)) {
    const head = Buffer.alloc(12), key = Buffer.alloc(20);
    head.writeUInt32LE(1);
    key.writeInt32LE(s.x, 4); key.writeInt32LE(s.y, 8); key.writeUInt32LE(s.w, 12); key.writeUInt32LE(s.h, 16);
    first.push(chunk(0x2022, Buffer.concat([head, str(name), key])));
  }

  const body = frames.map((frame, f) => {
    const chunks = f ? [] : first;
    for (const c of frame.cels) {
      const b = Buffer.alloc(16);
      b.writeUInt16LE(c.layer); b[6] = 255;
      if (c.link !== undefined) {
        b.writeUInt16LE(1, 7);
        const to = Buffer.alloc(2); to.writeUInt16LE(c.link);
        chunks.push(chunk(0x2005, Buffer.concat([b, to])));
      } else {
        b.writeInt16LE(c.x, 2); b.writeInt16LE(c.y, 4); b.writeUInt16LE(2, 7);
        const size = Buffer.alloc(4); size.writeUInt16LE(c.w); size.writeUInt16LE(c.h, 2);
        chunks.push(chunk(0x2005, Buffer.concat([b, size, deflateSync(c.rgba)])));
      }
    }
    const data = Buffer.concat(chunks), head = Buffer.alloc(16);
    head.writeUInt32LE(16 + data.length); head.writeUInt16LE(0xF1FA, 4);
    head.writeUInt16LE(Math.min(chunks.length, 0xFFFF), 6); head.writeUInt16LE(frame.ms, 8); head.writeUInt32LE(chunks.length, 12);
    return Buffer.concat([head, data]);
  });

  const head = Buffer.alloc(128), all = Buffer.concat(body);
  head.writeUInt32LE(128 + all.length); head.writeUInt16LE(0xA5E0, 4); head.writeUInt16LE(frames.length, 6);
  head.writeUInt16LE(width, 8); head.writeUInt16LE(height, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(1, 14);
  head.writeUInt16LE(frames[0].ms, 18); head.writeUInt16LE(palette.length, 32); head[34] = 1; head[35] = 1;
  head.writeUInt16LE(16, 40); head.writeUInt16LE(16, 42);
  return Buffer.concat([head, all]);
}

export function readAse(buf) {
  if (buf.readUInt16LE(4) !== 0xA5E0) throw new Error('Not an Aseprite file.');
  if (buf.readUInt16LE(12) !== 32) throw new Error('Only RGB colour mode is supported. In Aseprite: Sprite > Color Mode > RGB Color.');
  const width = buf.readUInt16LE(8), height = buf.readUInt16LE(10), layers = [], frames = [], slices = {};
  let p = 128;
  for (let f = 0; f < buf.readUInt16LE(6); f++) {
    const end = p + buf.readUInt32LE(p), frame = { ms: buf.readUInt16LE(p + 8), cels: new Map() };
    frames.push(frame);
    let q = p + 16;
    for (let n = buf.readUInt32LE(p + 12) || buf.readUInt16LE(p + 6); n > 0 && q < end; n--) {
      const size = buf.readUInt32LE(q), type = buf.readUInt16LE(q + 4), d = q + 6;
      if (type === 0x2004) {
        const len = buf.readUInt16LE(d + 16);
        layers.push({ name: buf.toString('utf8', d + 18, d + 18 + len), visible: !!(buf.readUInt16LE(d) & 1), kind: buf.readUInt16LE(d + 2), level: buf.readUInt16LE(d + 4), opacity: buf[d + 12] });
      } else if (type === 0x2005) {
        const layer = buf.readUInt16LE(d), kind = buf.readUInt16LE(d + 7);
        if (kind === 1) frame.cels.set(layer, frames[buf.readUInt16LE(d + 16)].cels.get(layer));
        else if (kind === 0 || kind === 2) {
          const raw = buf.subarray(d + 20, q + size);
          frame.cels.set(layer, { x: buf.readInt16LE(d + 2), y: buf.readInt16LE(d + 4), w: buf.readUInt16LE(d + 16), h: buf.readUInt16LE(d + 18), opacity: buf[d + 6], rgba: kind === 2 ? inflateSync(raw) : raw });
        } else throw new Error('Tilemap layers are not supported.');
      } else if (type === 0x2022 && buf.readUInt32LE(d)) {
        const len = buf.readUInt16LE(d + 12), k = d + 14 + len; // first key only
        slices[buf.toString('utf8', d + 14, k)] = { x: buf.readInt32LE(k + 4), y: buf.readInt32LE(k + 8), w: buf.readUInt32LE(k + 12), h: buf.readUInt32LE(k + 16) };
      }
      q += size;
    }
    p = end;
  }
  // A layer inside a hidden group is hidden too.
  const parents = [];
  for (const l of layers) { l.shown = l.visible && (l.level === 0 || parents[l.level - 1].shown); parents[l.level] = l; }
  return { width, height, layers, frames, slices };
}

// Flatten one frame to RGBA. `pick` chooses the layers; the default is what Aseprite shows.
export function flatten(ase, f, pick = l => l.shown) {
  const { width: W, height: H } = ase, out = Buffer.alloc(W * H * 4);
  ase.layers.forEach((layer, i) => {
    const cel = ase.frames[f].cels.get(i);
    if (layer.kind !== 0 || !cel || !pick(layer)) return;
    for (let j = 0; j < cel.h; j++) for (let k = 0; k < cel.w; k++) {
      const x = cel.x + k, y = cel.y + j, s = (j * cel.w + k) * 4, o = (y * W + x) * 4;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const sa = cel.rgba[s + 3] / 255 * cel.opacity / 255 * layer.opacity / 255, da = out[o + 3] / 255, a = sa + da * (1 - sa);
      if (!a) continue;
      for (let c = 0; c < 3; c++) out[o + c] = Math.round((cel.rgba[s + c] * sa + out[o + c] * da * (1 - sa)) / a);
      out[o + 3] = Math.round(a * 255);
    }
  });
  return out;
}

export function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const part = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]), out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length); body.copy(out, 4); out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(w, 0); head.writeUInt32BE(h, 4); head[8] = 8; head[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), part('IHDR', head), part('IDAT', deflateSync(raw, { level: 9 })), part('IEND', Buffer.alloc(0))]);
}

// Copy a box out of an sw-wide image into `dst` (dw wide) at (dx, dy), scaled by an integer.
export function blit(src, sw, { x, y, w, h }, dst, dw, dx = 0, dy = 0, scale = 1) {
  for (let j = 0; j < h * scale; j++) for (let i = 0; i < w * scale; i++) {
    const s = ((y + Math.floor(j / scale)) * sw + x + Math.floor(i / scale)) * 4;
    src.copy(dst, ((dy + j) * dw + dx + i) * 4, s, s + 4);
  }
}
