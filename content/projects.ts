export type Project = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  draft?: boolean;
  glance?: string[];
  sections: { heading: string; body: string[] }[];
};

const outline = ['Problem', 'Constraints', 'Architecture', 'My part', 'Trade-offs', 'Results', 'Lessons']
  .map(heading => ({ heading, body: [] }));

export const projects: Project[] = [
  {
    slug: 'meeting-transcription',
    title: 'Meeting transcription and speaker attribution',
    summary: 'Turning recorded meetings into transcripts that say who said what.',
    tags: ['speech', 'applied AI'],
    draft: true,
    sections: outline,
  },
  {
    slug: 'sales-agent',
    title: 'A sales agent with retrieval',
    summary: 'An applied-AI sales agent that answers from retrieved material.',
    tags: ['retrieval', 'agents'],
    draft: true,
    sections: outline,
  },
  {
    slug: 'pixel-room',
    title: 'This room',
    summary: 'A portfolio that is one 480×270 pixel room, filling the screen, with every sound synthesised.',
    tags: ['personal', 'Next.js', 'pixel art', 'Web Audio'],
    glance: [
      'The whole site is one 480×270 Aseprite file, shown only at whole-pixel scales.',
      'Click targets and animated regions are stored in the art file, so they cannot drift from the drawing.',
      'Next.js and React only. No image, audio or animation library.',
    ],
    sections: [
      {
        heading: 'Problem',
        body: [
          'A portfolio is usually a grid of cards. I wanted one that felt like a place: a desk at night, a CRT still on, rain on the window.',
          'A pixel room is easy to make charming and hard to make usable. Someone hiring needs to reach the work in one click, on a phone, with a keyboard, with the sound off. The room had to be an extra way in, never the only way.',
        ],
      },
      {
        heading: 'Constraints',
        body: [
          'No dependency without a reason: the site runs on Next.js, React and nothing else. Every section has its own URL. Everything works with JavaScript off. The palette starts from seven colours. Sound can always be switched off.',
        ],
      },
      {
        heading: 'Where the art lives',
        body: [
          'The room is one Aseprite file: 480×270, seventeen layers, a twelve-frame loop and a palette of 27 colours. Named slices mark the click targets and the regions that animate. The build reads that file directly and writes the images the page uses, so Aseprite is only needed for drawing.',
          'The first version of every layer was typed, not drawn. A script stored a material and a brightness for each pixel, let three light sources (lamp, monitor, window) raise the brightness, and picked colours from each material’s ramp with a narrow dither. That gave consistent lighting to start from. The file is laid out so that each layer can be redrawn by hand, one at a time, without touching code.',
        ],
      },
      {
        heading: 'Click targets that cannot drift',
        body: [
          'The click targets are slices in the same file as the art, and the hover outlines are a hidden layer in it. Move the telephone in Aseprite, move its slice with it, and the page follows on the next build.',
          'Each object is a plain link. Click one and the screen dissolves into big pixels spreading out from it, a one-line loader shows (the computer boots, the disk is read, the telephone dials), and the page dissolves back in. Without JavaScript it is still a link.',
        ],
      },
      {
        heading: 'Filling the screen',
        body: [
          'The room fills the window, but only at whole numbers of screen pixels per art pixel, so nothing shimmers. Whatever the art does not cover is filled by carrying the room on. The wall’s edge column repeats sideways. The floor is a tile whose planks wrap, so it continues in every direction without a seam.',
          'On a phone held upright the room is wider than the screen. It starts centred on the desk and you drag to look around.',
        ],
      },
      {
        heading: 'Trade-offs',
        body: [
          'Typed sprites are consistent but stiff. Furniture comes out well; anything organic wants a hand, which is why the source is now a file an artist can open.',
          'The print above the lamp uses fixed colours. At 42×32 pixels the room’s light map dithered it into mud, so it is the one object the lamp does not light.',
          'There is no navigation bar. Every page has one way out, back to the room, so moving between sections costs an extra click. In return nothing sits on top of the room.',
          'Sound is on by default, which browsers only permit after a first click or key press. The radio on the shelf switches it off, and so does the M key.',
          'Animation is six small sprite strips (rain, steam, a text cursor, the sleeper’s z’s, notes from the radio, the cat’s tail) cut from the twelve frames and stepped by CSS, plus one more for the cat when it is petted. They stop when the system asks for reduced motion.',
        ],
      },
      {
        heading: 'Credits',
        body: [
          'Planned and art-directed by Rahman. Built in a pairing session with an AI coding agent. The print is fan art of Guts, from Kentaro Miura’s Berserk.',
        ],
      },
    ],
  },
];

export const getProject = (slug: string) => projects.find(p => p.slug === slug);
