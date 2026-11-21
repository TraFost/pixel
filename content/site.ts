// Everything personal lives here. Lines marked DRAFT are guesses and need Rahman's check.
export const site = {
  name: 'Rahman',
  url: 'https://example.com', // TODO: real domain. Used for the sitemap and social cards.
  description: 'Rahman works on applied AI. This is his desk after hours: work, notes and a way to reach him.',
  role: 'Engineer · applied AI', // DRAFT. Page titles and search results only.
  headline: 'Rahman works on applied AI: meeting transcription, speaker attribution, and retrieval for sales agents.', // DRAFT. Screen readers and search only.

  // Leave a value empty and the Contact page simply omits it.
  email: '',
  github: '',
  linkedin: '',
  cv: '', // e.g. '/cv.pdf' once the file is in public/

  about: [
    'I’m Rahman, an engineer working on applied AI: speech, retrieval and agents.', // DRAFT
    'The longer version of this page (how I got here, what I care about, a timeline) is not written yet.',
  ],
};

// The four pages, each behind an object in the room.
// `file` is the window title, `loading` the line shown on the way in, `sfx` the sound it makes.
export const sections = [
  { key: 'work', href: '/work', title: 'Work', object: 'the computer', file: 'WORK.EXE', loading: 'Booting WORK.EXE', sfx: 'crt' },
  { key: 'notes', href: '/notes', title: 'Notes', object: 'the floppy disks', file: 'A:\\NOTES', loading: 'Reading disk A:', sfx: 'floppy' },
  { key: 'about', href: '/about', title: 'About', object: 'the notebook', file: 'NOTEBOOK.TXT', loading: 'Opening the notebook', sfx: 'page' },
  { key: 'contact', href: '/contact', title: 'Contact', object: 'the telephone', file: 'TELEPHONE', loading: 'Dialling', sfx: 'dial' },
] as const;

// The tour a first-time visitor gets, one line at a time. `spot` lights up an object in the room.
export const tour: { spot?: (typeof sections)[number]['key'] | 'radio' | 'cat'; text: string }[] = [
  { text: 'You made it in out of the rain. This room is the whole site. Let me show you around.' },
  { spot: 'work', text: 'The computer is still on. Click it for the work: projects and case studies.' },
  { spot: 'notes', text: 'The floppy disks are the notes. Short technical write-ups, one per disk.' },
  { spot: 'about', text: 'The notebook is the about page.' },
  { spot: 'contact', text: 'The telephone is for getting in touch.' },
  { spot: 'radio', text: 'The radio is playing the rain. Click it to switch the sound off, or back on.' },
  { spot: 'cat', text: 'And that is the cat. It answers when you come near, and it likes being petted.' },
  { text: 'That’s the room. From any page, Back or Esc brings you here. Quietly, please: someone’s asleep.' },
];
