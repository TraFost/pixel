import type { MetadataRoute } from 'next';
import { projects } from '@/content/projects';
import { sections, site } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', ...sections.map(s => s.href), ...projects.map(p => `/work/${p.slug}`)];
  return paths.map(path => ({ url: site.url + path }));
}
