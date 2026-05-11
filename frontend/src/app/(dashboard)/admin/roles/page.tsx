import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';

export default function AdminRolesPage() {
  return (
    <UnderConstructionPage
      title="Ruoli e Permessi"
      description="La configurazione avanzata dei permessi non è ancora attiva nel collaudo. La pagina temporanea evita il buco di navigazione."
      fallbackHref="/admin"
      fallbackLabel="Vai ad Amministrazione"
    />
  );
}
