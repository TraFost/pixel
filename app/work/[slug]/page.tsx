import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import room from '@/components/room/room.json';
import { Screen, Sprite } from '@/components/sections';
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
  const words = project.sections.flatMap(s => s.body).join(' ').split(' ').length;

  return (
    <Screen
      file={`${project.slug.toUpperCase()}.TXT`}
      eyebrow={project.tags.join(' · ')}
      title={project.title}
      lede={project.summary}
      sprite={project.slug === 'pixel-room' ? <Sprite box={room.crops.print} scale={3} /> : <Sprite box={room.hotspots.work} scale={1} />}
      status={project.draft ? 'outline only' : `${project.sections.length} parts · ${Math.max(1, Math.round(words / 200))} min read`}
    >
      {project.glance && (
        <aside className="glance">
          <p className="label">Quick read</p>
          <ul>{project.glance.map(g => <li key={g}>{g}</li>)}</ul>
        </aside>
      )}
      {project.draft && <p className="draft">This case study is an outline. The headings are here; the writing is not yet.</p>}
      <div className="prose">
        {project.sections.map((s, i) => (
          <section key={s.heading} className="chapter">
            <h2><span className="num" aria-hidden>{String(i + 1).padStart(2, '0')}</span>{s.heading}</h2>
            {s.body.map(p => <p key={p}>{p}</p>)}
          </section>
        ))}
      </div>
    </Screen>
  );
}
