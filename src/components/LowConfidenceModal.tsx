import { useState } from 'react';
import Modal from './Modal';
import { Check, AlertTriangle, Edit3, Save } from 'lucide-react';
import type { CharterField } from '@/data/freightData';

export function LowConfidenceModal({
  open,
  onClose,
  field,
  vendorName,
  onCorrect,
}: {
  open: boolean;
  onClose: () => void;
  field: CharterField | null;
  vendorName: string;
  onCorrect?: (correctedValue: string) => void;
}) {
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleClose = () => {
    setCorrecting(false);
    setCorrection('');
    setConfirmed(false);
    setSaved(false);
    onClose();
  };

  if (!field) return null;

  const confTone = field.confidence >= 0.8 ? 'good' : field.confidence >= 0.5 ? 'warn' : 'bad';
  const confClass = {
    good: 'bg-good-100 text-good-700',
    warn: 'bg-warn-100 text-warn-700',
    bad: 'bg-bad-100 text-bad-700',
  }[confTone];

  const sourceIcon = {
    pdf: '📄',
    excel: '📊',
    word: '📝',
    photo: '📷',
    email: '✉️',
  }[field.sourceType];

  const handleSave = () => {
    setSaved(true);
    if (onCorrect) onCorrect(correction);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Review Extraction" subtitle={`${vendorName} · ${field.name}`} size="md">
      <div className="space-y-5">
        {/* Extracted value */}
        <div>
          <div className="text-xs font-medium text-ink-500 mb-1.5">Extracted Value</div>
          <div className="px-4 py-3 bg-ink-50 rounded-lg text-base font-semibold text-ink-800">{field.value}</div>
        </div>

        {/* Source snippet */}
        <div>
          <div className="text-xs font-medium text-ink-500 mb-1.5">Source Snippet</div>
          <blockquote className="px-4 py-3 bg-ink-100 rounded-lg text-sm text-ink-600 italic border-l-4 border-ink-300">
            "{field.source}"
          </blockquote>
          <div className="text-xs text-ink-400 mt-1.5 flex items-center gap-1.5">
            <span>{sourceIcon}</span>
            <span>{field.source}</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-ink-500">Confidence Score</span>
          <span className={`px-2.5 py-1 rounded-md text-sm font-bold ${confClass}`}>
            {field.confidence.toFixed(2)}
          </span>
        </div>

        {/* Correct value */}
        {correcting ? (
          <div className="space-y-3 animate-slide-up">
            <div className="text-xs font-medium text-ink-500">Enter corrected value</div>
            <input
              type="text"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="Corrected value…"
              className="w-full px-3.5 py-2.5 border border-warn-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warn-300"
            />
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-warn-500 text-white text-sm font-semibold rounded-lg hover:bg-warn-600 transition"
            >
              <Save className="w-4 h-4" /> Save Correction
            </button>
          </div>
        ) : saved ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-good-50 rounded-lg text-sm text-good-700">
            <Check className="w-4 h-4" /> Correction saved and logged for audit.
          </div>
        ) : confirmed ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-good-50 rounded-lg text-sm text-good-700">
            <Check className="w-4 h-4" /> Value confirmed.
          </div>
        ) : null}

        {/* Action buttons */}
        {!confirmed && !saved && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setConfirmed(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-good-500 text-white text-sm font-semibold rounded-lg hover:bg-good-600 transition"
            >
              <Check className="w-4 h-4" /> Confirm
            </button>
            {!correcting && (
              <button
                onClick={() => setCorrecting(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-warn-500 text-white text-sm font-semibold rounded-lg hover:bg-warn-600 transition"
              >
                <Edit3 className="w-4 h-4" /> Correct Value
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-ink-400 flex items-center gap-1.5 pt-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Buyer corrections are logged for audit.
        </p>

        {(confirmed || saved) && (
          <button onClick={handleClose} className="w-full px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">
            Done
          </button>
        )}
      </div>
    </Modal>
  );
}
