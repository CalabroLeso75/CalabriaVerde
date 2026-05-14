import React from 'react';

type SectionLeadProps = {
  description: string;
  detail?: string;
};

export function SectionLead({ description, detail }: SectionLeadProps) {
  return (
    <div>
      <p className="text-sm" style={{ color: 'var(--cv-neutral-600)' }}>
        {description}
      </p>
      {detail && (
        <p className="mt-1 text-sm font-medium" style={{ color: 'var(--cv-neutral-700)' }}>
          {detail}
        </p>
      )}
    </div>
  );
}
