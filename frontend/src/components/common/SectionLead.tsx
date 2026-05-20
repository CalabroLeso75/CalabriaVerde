import React from 'react';

type SectionLeadProps = {
  description: string;
  detail?: string;
};

export function SectionLead({ description, detail }: SectionLeadProps) {
  return (
    <div className="max-w-4xl rounded-[var(--cv-radius-lg)] border bg-white/72 px-4 py-3 shadow-[var(--cv-shadow-sm)]" style={{ borderColor: 'var(--cv-border-subtle)' }}>
      <p className="text-base font-semibold" style={{ color: 'var(--cv-neutral-800)' }}>
        {description}
      </p>
      {detail && (
        <p className="mt-1 text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
          {detail}
        </p>
      )}
    </div>
  );
}
