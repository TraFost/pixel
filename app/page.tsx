import { PixelRoom } from '@/components/room/PixelRoom';
import { site } from '@/content/site';

export default function Home() {
  return (
    <main className="home">
      <h1 className="sr-only">{site.headline}</h1>
      <PixelRoom />
    </main>
  );
}
