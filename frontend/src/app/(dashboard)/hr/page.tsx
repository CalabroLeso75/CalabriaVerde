import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { withAppBasePath } from '@/lib/app-path';

const sections = [
  {
    title: 'Personale interno',
    description: 'Dipendenti aziendali con fascicolo, stato di servizio, documenti e dati contrattuali.',
    href: '/hr/interna',
    accent: 'var(--cv-primary)',
  },
  {
    title: 'Personale esterno',
    description: 'Collaboratori, consulenti, enti di supporto e organizzazioni collegate.',
    href: '/hr/esterna',
    accent: 'var(--cv-info)',
  },
];

export default function HrHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
          Scegli il perimetro di persone da consultare o aggiornare.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={withAppBasePath(section.href)} className="block">
            <Card padding="md" className="h-full" hover>
              <div className="space-y-3">
                <div className="w-10 h-1 rounded-full" style={{ background: section.accent }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                  {section.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  {section.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
