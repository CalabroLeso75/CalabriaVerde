import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';

export default function AdminSettingsPage() {
  return (
    <UnderConstructionPage
      title="Configurazione"
      description="Le impostazioni generali e le integrazioni esterne sono ancora in fase di preparazione. Il link è stato coperto con una pagina provvisoria."
      fallbackHref="/admin"
      fallbackLabel="Vai ad Amministrazione"
    />
  );
}
