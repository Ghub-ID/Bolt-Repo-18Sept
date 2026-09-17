import { ClipboardList, CheckCircle2, AlertTriangle, FileText, Clock, ShieldCheck, XCircle, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { activities } from '@/data/freightData';

const iconMap: Record<string, typeof ClipboardList> = {
  clipboard: ClipboardList,
  check: CheckCircle2,
  alert: AlertTriangle,
  file: FileText,
  clock: Clock,
  shield: ShieldCheck,
  x: XCircle,
  trending: TrendingUp,
};

const iconTone: Record<string, string> = {
  clipboard: 'bg-primary-50 text-primary-600',
  check: 'bg-good-50 text-good-600',
  alert: 'bg-warn-50 text-warn-600',
  file: 'bg-bad-50 text-bad-600',
  clock: 'bg-warn-50 text-warn-600',
  shield: 'bg-good-50 text-good-600',
  x: 'bg-bad-50 text-bad-600',
  trending: 'bg-info-50 text-info-600',
};

export default function RecentActivityPage() {
  return (
    <div className="px-8 py-7 max-w-3xl">
      <PageHeader title="Recent Activity" subtitle="A log of the latest events across your freight procurement" />

      <div className="bg-white rounded-xl border border-ink-200 shadow-card overflow-hidden">
        <div className="divide-y divide-ink-100">
          {activities.map((act, i) => {
            const Icon = iconMap[act.icon] || ClipboardList;
            const tone = iconTone[act.icon] || 'bg-ink-100 text-ink-600';
            return (
              <div key={act.id} className="flex items-start gap-4 px-5 py-4 hover:bg-ink-50 transition">
                {/* Timeline dot */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {i < activities.length - 1 && <div className="absolute left-1/2 top-10 -translate-x-1/2 w-px h-full bg-ink-200" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="text-sm font-semibold text-ink-800">{act.title}</div>
                  <div className="text-sm text-ink-500 mt-0.5">{act.detail}</div>
                  <div className="text-xs text-ink-400 mt-1">{act.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
