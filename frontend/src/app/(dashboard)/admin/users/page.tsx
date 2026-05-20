import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';

export default function AdminUsersPage() {
  return (
    <UnderConstructionPage
      title="Utenti"
      description="La pagina per account, stati e permessi utente è ancora in preparazione. Per ora il link porta a una schermata temporanea stabile."
      fallbackHref="/admin"
      fallbackLabel="Vai ad amministrazione"
    />
  );
}
