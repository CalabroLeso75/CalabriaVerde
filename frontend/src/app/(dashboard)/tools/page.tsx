import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const tools = [
  {
    title: 'Geografia',
    description: 'Stati, regioni, province, comuni, confini amministrativi e toponimi Calabria.',
    href: '/tools/geography',
    accent: 'var(--cv-info)',
  },
  {
    title: 'Codice Fiscale',
    description: 'Ricerca anagrafica, analisi del codice, codici luogo e generazione inversa da dati anagrafici.',
    href: '/tools/codice-fiscale',
    accent: 'var(--cv-primary)',
  },
];

export default function ToolsHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
          Raccolta di strumenti riusabili e trasversali a piu moduli del gestionale.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="block">
            <Card padding="md" className="h-full transition-transform hover:-translate-y-0.5">
              <div className="space-y-3">
                <div className="w-10 h-1 rounded-full" style={{ background: tool.accent }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--cv-neutral-900)' }}>
                  {tool.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
                  {tool.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
