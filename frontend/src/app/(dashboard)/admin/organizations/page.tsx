import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';

export default function AdminOrganizationsPage() {
  return (
    <UnderConstructionPage
      title="Organizzazioni"
      description="La gestione di distretti, sedi e strutture è in costruzione. Qui trovi un punto di appoggio pulito finché non completiamo il modulo."
      fallbackHref="/admin"
      fallbackLabel="Vai ad Amministrazione"
    />
  );
}
