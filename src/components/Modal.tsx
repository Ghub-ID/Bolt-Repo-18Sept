import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${sizeMap[size]} w-full bg-white rounded-2xl shadow-modal animate-scale-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-ink-200">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-4 w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto scrollbar-thin flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-ink-200 flex items-center justify-end gap-3 bg-ink-50/50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}
