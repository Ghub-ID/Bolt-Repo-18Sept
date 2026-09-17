interface MetricCardProps {
  label: string;
  value: string | number;
  tone?: 'primary' | 'warn' | 'info' | 'good' | 'bad';
  icon?: string;
}

const toneStyles: Record<string, { bg: string; text: string; ring: string }> = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-700', ring: 'ring-primary-100' },
  warn: { bg: 'bg-warn-50', text: 'text-warn-700', ring: 'ring-warn-100' },
  info: { bg: 'bg-info-50', text: 'text-info-700', ring: 'ring-info-100' },
  good: { bg: 'bg-good-50', text: 'text-good-700', ring: 'ring-good-100' },
  bad: { bg: 'bg-bad-50', text: 'text-bad-700', ring: 'ring-bad-100' },
};

export default function MetricCard({ label, value, tone = 'primary', icon }: MetricCardProps) {
  const s = toneStyles[tone];
  return (
    <div className="bg-white rounded-xl border border-ink-200 p-4 shadow-card hover:shadow-cardHover transition group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        {icon && <span className={`w-7 h-7 rounded-lg ${s.bg} ${s.text} flex items-center justify-center text-sm`}>{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${s.text}`}>{value}</div>
    </div>
  );
}
