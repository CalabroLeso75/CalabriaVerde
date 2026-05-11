import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';

export default function WarehouseReportPage() {
  return (
    <UnderConstructionPage
      title="Report Magazzino"
      description="I report del magazzino non sono ancora stati attivati. Da qui puoi tornare indietro senza interrompere il flusso di prova."
      fallbackHref="/warehouse"
      fallbackLabel="Vai a Magazzino"
    />
  );
}
