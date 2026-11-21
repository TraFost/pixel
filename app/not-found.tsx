import { Screen } from '@/components/sections';

export default function NotFound() {
  return (
    <Screen section="contact" file="ERROR 404" eyebrow="404" title="This number is not in service." status="no such page">
      <p>There is nothing at this address. The room is one step back.</p>
    </Screen>
  );
}
