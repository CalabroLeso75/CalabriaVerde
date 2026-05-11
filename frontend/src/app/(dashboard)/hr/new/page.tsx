import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';

export default function HrNewEmployeePage() {
  return (
    <UnderConstructionPage
      title="Nuovo Dipendente"
      description="L'inserimento manuale di un nuovo fascicolo non è ancora stato completato. La pagina temporanea mantiene attivo il link dalla dashboard."
      fallbackHref="/hr"
      fallbackLabel="Vai a Risorse Umane"
    />
  );
}
