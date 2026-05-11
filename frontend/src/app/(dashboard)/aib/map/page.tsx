import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';

export default function AibMapPage() {
  return (
    <UnderConstructionPage
      title="Mappa Squadre AIB"
      description="La mappa operativa delle squadre non è ancora disponibile in collaudo. La rotta adesso risponde correttamente con una pagina temporanea."
      fallbackHref="/aib"
      fallbackLabel="Vai ad AIB"
    />
  );
}
