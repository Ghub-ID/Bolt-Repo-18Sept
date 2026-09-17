import { type ReactNode } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

export function BackButton({ to, label }: { to?: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-primary-600 transition"
    >
      <ArrowLeft className="w-4 h-4" />
      {label || 'Back'}
    </button>
  );
}

export function PrimaryButton({ children, onClick, className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 active:scale-[0.98] transition shadow-pop ${className}`}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, className = '', tone = 'default' }: { children: ReactNode; onClick?: () => void; className?: string; tone?: 'default' | 'good' | 'warn' | 'bad' | 'primary' }) {
  const toneClass = {
    default: 'border-ink-300 text-ink-700 hover:bg-ink-50',
    good: 'border-good-500 text-good-600 hover:bg-good-50',
    warn: 'border-warn-500 text-warn-600 hover:bg-warn-50',
    bad: 'border-bad-500 text-bad-600 hover:bg-bad-50',
    primary: 'border-primary-500 text-primary-600 hover:bg-primary-50',
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white text-sm font-semibold rounded-lg border transition active:scale-[0.98] ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-600 rounded-lg hover:bg-ink-100 transition ${className}`}
    >
      {children}
    </button>
  );
}

export function ActionButton({ children, tone, onClick }: { children: ReactNode; tone: 'good' | 'warn' | 'bad'; onClick?: () => void }) {
  const map = {
    good: 'bg-good-500 text-white hover:bg-good-600',
    warn: 'bg-warn-500 text-white hover:bg-warn-600',
    bad: 'bg-bad-500 text-white hover:bg-bad-600',
  };
  return (
    <button onClick={onClick} className={`px-2.5 py-1 text-xs font-semibold rounded-md transition active:scale-95 ${map[tone]}`}>
      {children}
    </button>
  );
}

export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-ink-500 mb-3">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-ink-300" />}
          <span className={i === items.length - 1 ? 'text-ink-700 font-medium' : ''}>{item}</span>
        </span>
      ))}
    </div>
  );
}
