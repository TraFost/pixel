import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import room from '@/components/room/room.json';
import { Reader } from '@/components/Reader';
import { pad, Prose, Screen, Sprite } from '@/components/sections';
import { minutes } from '@/content/blocks';
import { getProject, projects } from '@/content/projects';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => projects.map(p => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: project.title, description: project.summary } : {};
}

export default async function ProjectPage({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const chapters = project.sections.map(s => ({ ...s, id: s.heading.toLowerCase().replace(/[^a-z]+/g, '-') }));
  const length = project.draft ? 'Outline' : `${minutes(project.sections.flatMap(s => s.body))} min read`;

  return (
    <Screen
      file={`${project.slug.toUpperCase()}.TXT`}
      eyebrow={project.tags.join(' · ')}
      title={project.title}
      lede={project.summary}
      facts={[...(project.facts ?? []), ['Length', length]]}
      sprite={project.slug === 'pixel-room' && <Sprite box={room.crops.print} scale={4} />}
      status={`${chapters.length} chapters · ${length.toLowerCase()}`}
    >
      <Reader full chapters={chapters.map(c => ({ id: c.id, title: c.heading }))}>
        {project.glance && (
          <aside className="glance">
            <p className="label">Quick read</p>
            <ul>{project.glance.map(g => <li key={g}>{g}</li>)}</ul>
          </aside>
        )}
        {project.draft && <p className="draft">This case study is an outline. The chapters are here; the writing is not yet.</p>}
        <div className="prose">
          {chapters.map((c, i) => (
            <section key={c.id} id={c.id} className="chapter" tabIndex={-1}>
              <h2><span className="num" aria-hidden>{pad(i + 1)}</span>{c.heading}</h2>
              {c.body.length ? <Prose blocks={c.body} /> : <p className="unwritten">Not written yet.</p>}
            </section>
          ))}
        </div>
      </Reader>
    </Screen>
  );
}
