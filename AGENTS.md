# AGENTS.md

Guide for any agent working in this repo. Read it before changing files.

`README.md` is the short project introduction. Contributor guidance belongs in this file.
`.gitignore` excludes all other Markdown files. Do not add other Markdown files.

## Hard rules

1. **Keep the codebase clean.** No dead code, unused files, commented-out code, leftover debug output or
   temporary files. Delete what a change makes redundant, in the same change. Do not leave unnecessary
   comments above a function or component (nothing that only names or restates what the body does).
2. **Follow the conventions already in the code.** They are listed under "Conventions". Do not introduce
   a second way of doing something the repo already does one way.
3. **Never invent facts about Rahman**, his employers or his results.
4. **Never edit generated files by hand** (`public/art/*`, `components/room/room.json`).
5. **Never regenerate `room.aseprite` without the check** under "Changing the art safely".
6. **Do not change the behaviour under "How the site behaves"** unless Rahman asks.

## What this is

Rahman's portfolio: one pixel-art room that fills the screen and acts as the menu. Clicking an object
opens a page; every page has one way out, back to the room.

Stack: Next.js 16 (App Router), React 19, TypeScript. No other runtime dependencies. Package manager:
**Bun**, which also runs the art scripts (`bun.lock` is committed; do not add `package-lock.json`, and do
not use npm or call `node`). Git repo, branch `main`; commit messages follow Conventional Commits
(`feat:`, `chore:`), as the history does. There are no tests.

```
bun install
bun run dev        # http://localhost:3000
bun run build      # needs network once: next/font fetches the fonts
bun run art        # rebuild public/art/* and components/room/room.json from the Aseprite file
bun run art:seed   # DANGER: regenerates the Aseprite file from a script. See "The art".
```

## Decisions already made

Rahman chose these. Do not reopen them.

- No header, navigation bar or footer anywhere. The room is the menu.
- The room is the whole home page, with nothing laid over it except the tour box and the `?` button.
- Sound is on by default. The radio in the room switches it.
- Objects navigate to pages with an animated transition. There are no side panels.
- No Playwright, no test suite.
- The art source is an Aseprite file, and he wants it hand-drawn there eventually.
- Touch screens show outlines but no object labels. The tour is how people learn what each object opens.
- An upright tablet shows the desk large and pans, like a phone. It does not shrink the room to fit.
  (Kept "for now": revisit only if Rahman asks.)

## How the site behaves

**The room (`/`)**
- Fills the viewport. The art is 480×270 and is only ever shown at whole device pixels per art pixel.
  Leftover screen is filled by repeating the wall's edge column and a wrapping floor tile.
- Landscape: the whole room always fits. Portrait: the room is wider than the screen, pans sideways and
  starts centred on the desk.
- Four objects are links: computer → `/work`, floppy disks → `/notes`, notebook → `/about`,
  telephone → `/contact`. Hovering shows an outline and a small label directly under the object.
- The radio switches sound on and off (so does the M key, on any page). Notes drift up from it while
  sound is on.
- The cat meows once when the mouse arrives, and not again until the mouse has been away for 1.5
  seconds. Clicking it makes it purr for 3.6 seconds with its own animation. It has an outline but no
  text label.
- The person in the bed is decoration: no click target.

**The tour**
- A game-style dialogue box that walks through the objects, one line at a time. The lines are in
  `content/site.ts` (`tour`).
- It runs on every full load of the home page. Coming back from a page does not restart it. The `?`
  button replays it. Esc or Skip ends it.
- It must not talk about Rahman. It only explains the room.
- The box must not change size between steps, and a new line must never flash up already written.
- The box sits along the bottom and must never cover the object it is describing: when that object
  reaches into the bottom strip, the box moves to the top for that step.
- On a short screen (a phone on its side) the box becomes one thin strip, text left, buttons right.
- A line marked `pan` is only said where the room is wider than the screen. It tells people to drag.
- Pressing Next while a line is typing finishes the line; the next press moves on.

**Moving between pages**
- Every navigation goes through `travel()` in `components/Travel.tsx`: the screen dissolves into big
  pixels from the clicked point, a one-line loader shows, the next page dissolves in.
- Skipped entirely under `prefers-reduced-motion`.

**Pages**
- Each page is a "window" (`Screen` in `components/sections.tsx`): title bar with Back, pixel headings,
  status bar.
- Back, and Esc, always go to the room. Never add links from one section to another.
  `/work` → `/work/[slug]` is the only page-to-page link.
- Every page that reads (`Reader`) fills the block bar under the title bar as it scrolls, and lets
  sections below the fold fade up as they arrive. Nothing already on screen is ever hidden.
- **Work** is a game menu: a cursor steps in beside the hovered or focused row, and ↑ ↓ move between rows.
- Pages that are read fill the whole screen, like a maximised window: every case study, and a note
  once it is open. They mark their `Reader` as `full`. The lists, About and Contact stay windowed.
- **Case studies** have a hero with facts, a chapter list that sticks (a rail on desktop, a strip
  under the title bar on narrow screens) and marks the chapter being read, then the chapters.
- **Notes** has no per-note routes. `/notes` shows an index with category filters; `/notes#slug` shows
  that note alone, in the same window. "All notes" returns to the index, the browser's back button
  works, and Back or Esc still go to the room. Without JavaScript every note is listed under the index.
- **About** is a scrapbook: a timeline worked like tabs (← → move), and prints from the room taped to
  the page. The cat's print meows.
- **Contact** is a sheet of writing paper, with no picture on it. The links come first and are never hidden. The envelope
  under them opens to a short letter and a button that copies the address.
- Chapters and notes can hold figures (interactive diagrams) and code, as well as paragraphs.

**Sound**
- Everything is synthesised in `lib/sound.ts` with Web Audio. There are no audio files.
- Browsers block audio until the first click or key press. "On by default" means it starts then.

## Where things are

| Path | What |
|---|---|
| `content/site.ts` | Name, contact details, the four sections, the tour lines |
| `content/projects.ts`, `content/notes.ts` | Case studies and notes, as typed data |
| `content/blocks.ts` | What a chapter or note body is made of: paragraphs, code, figures |
| `app/` | Routes. `layout.tsx` loads fonts and mounts the transition overlay |
| `components/room/PixelRoom.tsx` (+ `.module.css`) | The room, hotspots, radio, cat, tour |
| `components/room/room.json` | **Generated.** Sizes and boxes for hotspots, loops and crops |
| `components/Travel.tsx` (+ `.module.css`) | Page transition, `Go` link, `Back` button, sound boot, M key |
| `components/sections.tsx` | Page window (`Screen`), art crops (`Sprite`), body renderer (`Prose`) |
| `components/Reader.tsx` | Reading progress, chapter list, reveal on scroll |
| `components/Figure.tsx` | The interactive figures, by name |
| `components/Work.tsx`, `Notes.tsx`, `About.tsx`, `Contact.tsx` | The interactive part of each page (each with its CSS Module) |
| `lib/sound.ts` | All sounds and the on/off state |
| `styles/tokens.css`, `styles/global.css` | Colours and page styles |
| `assets/source/room.aseprite` | **The art source** |
| `assets/source/export.mjs` | `bun run art`: Aseprite file → PNGs and `room.json` |
| `assets/source/ase.mjs` | Small `.aseprite` reader/writer and PNG writer |
| `assets/source/seed.mjs` | Script that generated the Aseprite file |
| `public/art/*` | **Generated** by `bun run art` |
| `app/icon.png` | Favicon. Written by the seed script only |
| `licenses/` | Licence texts for the four fonts (all SIL OFL 1.1) |

## Conventions

Match these. If you are unsure how to do something, find where the repo already does it and copy that.

**Structure**
- Content is typed data in `content/*.ts`. No MDX, no CMS, no database.
- Server components by default. Add `'use client'` only to a file that needs state, effects or events.
- Components use named exports. Only Next.js route files (`page.tsx`, `layout.tsx`, `not-found.tsx`,
  `sitemap.ts`, `robots.ts`) use a default export.
- Import across folders with the `@/` alias, within a folder with `./`.
- One component file per concern, not per component: small helpers live beside what uses them.

**Navigation**
- Links to another page use the `Go` component. Never a bare `<a href="/…">` and never `next/link`: both
  skip the transition. Links within a page (`#chapter`, `#note`) are plain anchors.

**Content blocks**
- A chapter or note body is a list of blocks (`content/blocks.ts`): a string is a paragraph,
  `{ code, caption }` is a snippet, `{ figure, caption }` is an interactive figure.
- A new figure is a new name in `FigureName` and a component in `Figure.tsx`. A figure must show
  something true about the site, work from the keyboard, and announce its result in text.

**Styling**
- A component with its own behaviour gets a CSS Module next to it (`PixelRoom`, `Travel`). Page styling
  goes in `styles/global.css` as plain class names. No Tailwind, no CSS-in-JS. Inline styles only for
  values worked out at run time (positions from `room.json`, the cycling icon colours).
- Colours come from the custom properties in `styles/tokens.css`. Do not write a hex colour anywhere
  else. The two exceptions are places CSS variables cannot reach: the transition canvas in
  `Travel.tsx` and `themeColor` in `app/layout.tsx`.
- Night is the default surface. Add the `paper` class to anything made of paper so its tokens flip.
- Square corners, 3px borders, hard offset shadows. No gradients for decoration, no blur, no rounding.

**Type**
- IBM Plex Sans for anything you read. Pixelify Sans for headings and dialogue. Silkscreen for tiny
  labels. IBM Plex Mono for metadata. Never set paragraphs in a pixel font.

**Code style**
- TypeScript, strict. Two-space indent, single quotes, semicolons.
- Agents must not add comments directly above a function or component unless the signature cannot express
  the constraint. No labels like `// Handle click`, no boilerplate JSDoc on obvious exports. Comment only
  non-obvious constraints, workarounds, or contracts—and put that on the line that needs it, not on the
  signature.
- Smallest change that fully does the job. No new dependency for a few lines of code, and no
  abstraction for a single use.
- Copy and comments use British spelling (colour, synthesised).

**Accessibility**
- Everything interactive is a real link or button with an accessible name, and works from the keyboard.
- Text colours pass WCAG AA. On paper use ink, shadow or deep amber; plain amber and sage fail there.
- Anything that moves stops under `prefers-reduced-motion`.
- Small click targets get their 44px minimum from CSS, not from padding the art.

## The art

The source is `assets/source/room.aseprite`: 480×270, RGB, 12 frames of 100 ms, 27 colours.

Rahman wants it hand-drawn in Aseprite. So far every pixel was generated by `seed.mjs`. Do not describe
the art as hand-drawn. The build reads the file with `ase.mjs` and does not need the Aseprite program;
it supports RGB colour mode and Normal blending only.

**Layers**, back to front: shell, window, print, pinboard and clock, bed, person, floor things,
bookshelf, radio, desk, lamp and mug, computer, floppies, notebook and photo, telephone, chair, cat.
Then three hidden layers the page needs:

| Hidden layer | Purpose |
|---|---|
| `alt/cat` | The cat being petted. Swapped in for the `cat` layer inside the `cat` slice after a click. An `alt/<name>` layer works for any layer that has a slice of the same name. |
| `hover` | The outlines shown on hover and focus. Redraw it when an object changes shape. |
| `floor tile` | Bare floor, 480×108. The page tiles it, so it must wrap left to right and top to bottom. |

**Slices**

| Slice | Purpose |
|---|---|
| `work`, `notes`, `about`, `contact` | Click targets that open pages |
| `radio` | Click target that switches sound |
| `cat` | Click target for the cat. Taller than the cat: the hearts need the headroom |
| `loop/rain`, `loop/steam`, `loop/caret`, `loop/zzz`, `loop/notes`, `loop/tail` | Animated regions, played across the 12 frames. `loop/notes` is hidden while sound is off, so frame 1 must have no notes in it |
| `crop/print` | The print, shown on the "This room" case study |

Keep click-target slices tight to the object: the label hangs directly under the slice.

**Edges.** The right-hand pixel column must hold only wall and floor; the page repeats it sideways. The
top-right pixel is the wall colour used above the art.

**Palette**, dark to light. Stay inside it.

| Ramp | Colours |
|---|---|
| Night / wall | `#14171F` `#1B202B` `#242A38` `#323A4B` `#434C5E` `#525761` |
| Blue | `#5A6C7E` `#738A9B` `#9DB1BE` |
| Lamp-lit wall | `#473B46` `#634A47` |
| Wood / amber | `#33262A` `#4E3830` `#74503C` `#9C6B46` `#C58A52` `#E0AE74` `#F1D3A0` |
| Sage | `#414E47` `#63735E` `#8C9B7C` `#B3C0A2` |
| Plastic / paper | `#7C7A70` `#A6A08D` `#CDC5AD` `#F4EEDF` |
| Ink | `#292D32` |

**Drawing rules**
- Three-quarter view: front wall plus visible top faces. Furniture against the wall has its top-back
  edge at `floor line − height`.
- Rainy night. Light comes from the desk lamp (warm), the screen and the window (cool). The wall goes
  mauve by the lamp and blue by the screen.
- Top faces are one step lighter than front faces. Contact shadows are one step darker.
- Dither only at the edge between two steps of a ramp, never across a whole surface.
- Screen, lamp underside, LEDs, city lights and rain are flat bright colours.
- Living things (the cat, the sleeper, the print) use fixed, hand-picked colours, a clear silhouette and
  a face. Two earlier attempts were rejected: a curled-up cat that "looks like a bug" and a sleeper
  drawn as a ridge under a blanket. Look at an enlarged render before calling a sprite done:
  `ZOOM=x,y,w,h,scale bun run art` writes `zoom.png` (git-ignored; delete it afterwards).
- The print above the lamp is fan art of Guts, from Kentaro Miura's *Berserk*. Keep the credit on the
  About page and in the "This room" case study.

### Changing the art safely

`bun run art:seed -- --force` rebuilds the Aseprite file from `seed.mjs` and destroys anything drawn in
Aseprite. Before running it:

1. Copy `room.aseprite` aside.
2. Run the seed from the *unchanged* `seed.mjs` and compare bytes with the copy. Use Bun for this: Node
   compresses differently, so its output never matches byte for byte even when nothing changed.
3. If they differ, find out why before going further. Either the file was edited in Aseprite (do not
   overwrite it), or `seed.mjs` was edited by hand (keep that edit: Rahman has changed it himself).
4. Only then change `seed.mjs`, seed, and run `bun run art`.

Once Rahman starts drawing in Aseprite, stop using the seed script.

## Content rules

- Lines marked `DRAFT` in `content/site.ts` are guesses and still need Rahman's confirmation. Empty
  contact fields stay empty until he fills them. The site URL there is a placeholder.
- Two case studies are deliberate outlines. Do not write their bodies without real input from him.
- The About timeline (`timeline` in `content/site.ts`) has one written entry. The others have a title
  only and show as blank pages with `????` for the year. Fill them only with dates and stories he gives.
- Text on the site about how it was built must stay true. When behaviour changes, update the "This room"
  case study and the notes in the same change.
- Voice: specific and plain. No stock portfolio phrases.

## Checking your work

Before reporting a change as done:

1. `bun run build` must pass.
2. Run the production build (`bunx next start -p 3210`) and exercise the change in a real browser, at a
   desktop size and a phone size. Earlier work drove headless Chrome over the DevTools protocol with
   throwaway scripts kept outside the repo.
3. Report what you checked and what you could not.
4. Update this file if the change makes any line of it untrue.

Not yet verified by anyone: Firefox, Safari and real phones; and `room.aseprite` has not been opened in
Aseprite itself since the radio and cat were added.
