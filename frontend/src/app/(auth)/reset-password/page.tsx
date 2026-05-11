import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';

export default function ResetPasswordPage() {
  return (
    <UnderConstructionPage
      title="Recupero Password"
      description="Il flusso di reset password non è ancora attivo nell'ambiente di collaudo. Per ora il collegamento porta a una pagina temporanea."
      fallbackHref="/login"
      fallbackLabel="Vai al login"
    />
  );
}
