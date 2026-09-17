import { type ReactNode } from 'react';

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral' | 'primary';

const toneMap: Record<Tone, string> = {
  good: 'bg-good-100 text-good-700 border-good-100',
  warn: 'bg-warn-100 text-warn-700 border-warn-100',
  bad: 'bg-bad-100 text-bad-700 border-bad-100',
  info: 'bg-info-100 text-info-700 border-info-100',
  neutral: 'bg-ink-100 text-ink-600 border-ink-200',
  primary: 'bg-primary-100 text-primary-700 border-primary-100',
};

export default function Badge({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${toneMap[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusTag({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    Open: 'primary',
    'In Approval': 'info',
    Awarded: 'good',
    Closed: 'neutral',
    Declined: 'bad',
    Pending: 'warn',
  };
  const tone = map[status] || 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}
