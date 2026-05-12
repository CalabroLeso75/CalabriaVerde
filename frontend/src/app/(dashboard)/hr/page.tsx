import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const sections = [
  {
    title: 'Anagrafica interna',
    description: 'Personale dipendente dell azienda con fascicolo, stato di servizio e dati contrattuali.',
    href: '/hr/interna',
    accent: 'var(--cv-primary)',
  },
  {
    title: 'Anagrafica esterna',
    description: 'Personale esterno, enti di supporto e organizzazioni collegate censite nel sistema.',
    href: '/hr/esterna',
    accent: 'var(--cv-info)',
  },
];

export default function HrHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
          Scegli il perimetro di anagrafica da gestire.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="block">
            <Card padding="md" className="h-full transition-transform hover:-translate-y-0.5">
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
