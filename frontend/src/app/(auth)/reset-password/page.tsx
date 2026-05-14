import { UnderConstructionPage } from '@/components/system/UnderConstructionPage';
import { withAppBasePath } from '@/lib/app-path';

export default function ResetPasswordPage() {
  return (
    <UnderConstructionPage
      title="Recupero Password"
      description="Il flusso di reset password non è ancora attivo nell'ambiente di collaudo. Per ora il collegamento porta a una pagina temporanea."
      fallbackHref={withAppBasePath('/login')}
      fallbackLabel="Vai al login"
    />
  );
}
