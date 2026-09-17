import { useState } from 'react';
import Modal from './Modal';
import { Check, AlertTriangle, X, Send, Mail, Bell } from 'lucide-react';

// ---- Approve Modal ----
export function ApproveModal({ open, onClose, vendorName }: { open: boolean; onClose: () => void; vendorName: string }) {
  const [done, setDone] = useState(false);
  const handleClose = () => {
    setDone(false);
    onClose();
  };
  return (
    <Modal open={open} onClose={handleClose} title="Confirm Vendor Bid for Approval" subtitle={vendorName} size="sm"
      footer={
        !done ? (
          <>
            <button onClick={handleClose} className="px-4 py-2.5 text-sm font-medium text-ink-600 rounded-lg hover:bg-ink-100 transition">Cancel</button>
            <button onClick={() => setDone(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-good-500 text-white text-sm font-semibold rounded-lg hover:bg-good-600 transition">
              <Check className="w-4 h-4" /> Confirm
            </button>
          </>
        ) : (
          <button onClick={handleClose} className="px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">Done</button>
        )
      }
    >
      {done ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-good-50 flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 text-good-600" />
          </div>
          <p className="text-ink-700 font-medium">{vendorName} approved for RFP-052.</p>
        </div>
      ) : (
        <p className="text-sm text-ink-600">Are you sure you want to approve the bid from <span className="font-semibold text-ink-800">{vendorName}</span>? This will move the bid to the approval workflow.</p>
      )}
    </Modal>
  );
}

// ---- Clarify Modal ----
const clarifyOptions = ['Rate breakdown', 'Currency terms', 'Volume discount', 'Free days', 'Transit', 'Documentation', 'Equipment', 'Incoterms'];

export function ClarifyModal({ open, onClose, vendorName }: { open: boolean; onClose: () => void; vendorName: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const toggle = (opt: string) => setSelected((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
  const handleClose = () => { setSelected([]); setText(''); setSent(false); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Send Clarification" subtitle={vendorName}
      footer={
        sent ? <button onClick={handleClose} className="px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">Done</button> :
        <button onClick={() => setSent(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-warn-500 text-white text-sm font-semibold rounded-lg hover:bg-warn-600 transition">
          <Send className="w-4 h-4" /> Send Clarification
        </button>
      }
    >
      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-warn-50 flex items-center justify-center mx-auto mb-3">
            <Send className="w-7 h-7 text-warn-600" />
          </div>
          <p className="text-ink-700 font-medium">Clarification sent to {vendorName}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-ink-500 mb-2">Select items to clarify</div>
            <div className="grid grid-cols-2 gap-2">
              {clarifyOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 hover:bg-ink-50 cursor-pointer transition">
                  <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-primary-500 w-4 h-4" />
                  <span className="text-sm text-ink-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-500 mb-2">Additional notes</div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Type your clarification request…" className="w-full px-3.5 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---- Decline Modal ----
const declineReasons = ['High price', 'Unfavourable terms', 'Long transit', 'Low confidence', 'Incomplete', 'Insufficient track record', 'Coverage gap'];

export function DeclineModal({ open, onClose, vendorName }: { open: boolean; onClose: () => void; vendorName: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  const toggle = (opt: string) => setSelected((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
  const handleClose = () => { setSelected([]); setText(''); setDone(false); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Decline Vendor Bid" subtitle={vendorName}
      footer={
        done ? <button onClick={handleClose} className="px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">Done</button> :
        <button onClick={() => setDone(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-bad-500 text-white text-sm font-semibold rounded-lg hover:bg-bad-600 transition">
          <X className="w-4 h-4" /> Confirm Decline
        </button>
      }
    >
      {done ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-bad-50 flex items-center justify-center mx-auto mb-3">
            <X className="w-7 h-7 text-bad-600" />
          </div>
          <p className="text-ink-700 font-medium">{vendorName} bid declined.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-ink-500 mb-2">Reasons for declining</div>
            <div className="grid grid-cols-2 gap-2">
              {declineReasons.map((opt) => (
                <label key={opt} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 hover:bg-ink-50 cursor-pointer transition">
                  <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-bad-500 w-4 h-4" />
                  <span className="text-sm text-ink-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-500 mb-2">Additional notes</div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Optional explanation…" className="w-full px-3.5 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---- Share Modal ----
export function ShareModal({ open, onClose, context }: { open: boolean; onClose: () => void; context: string }) {
  const [email, setEmail] = useState('');
  const [people, setPeople] = useState<string[]>(['arjun.mehta@oceanlink.com', 'sara.k@nordicfreight.dk']);
  const sendInvite = () => { if (email.trim()) { setPeople([...people, email.trim()]); setEmail(''); } };
  return (
    <Modal open={open} onClose={onClose} title="Share" subtitle={context}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" className="flex-1 px-3.5 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <button onClick={sendInvite} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">
            <Mail className="w-4 h-4" /> Send Invite
          </button>
        </div>
        <div>
          <div className="text-xs font-medium text-ink-500 mb-2">Shared with</div>
          <div className="space-y-2">
            {people.map((p) => (
              <div key={p} className="flex items-center justify-between px-3 py-2 bg-ink-50 rounded-lg">
                <span className="text-sm text-ink-700">{p}</span>
                <button onClick={() => setPeople(people.filter((x) => x !== p))} className="text-xs text-bad-600 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---- TBC Update Modal ----
import { useRfpCharter, TBC_DROPDOWN_OPTIONS, CHARTER_LABELS } from '@/context/RfpCharterContext';

export function TbcModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { charter, resolveTbc } = useRfpCharter();
  const [done, setDone] = useState(false);
  const handleClose = () => { setDone(false); onClose(); };

  const tbcFields = charter.tbc_fields.filter((f) => TBC_DROPDOWN_OPTIONS[f]);

  return (
    <Modal open={open} onClose={handleClose} title="Update TBC Fields" subtitle="RFP-052 · Specialty Rice → Denmark"
      footer={done ? <button onClick={handleClose} className="px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">Done</button> :
        <button onClick={() => setDone(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">
          <Bell className="w-4 h-4" /> Update & Notify
        </button>
      }
    >
      {done ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 text-primary-600" />
          </div>
          <p className="text-ink-700 font-medium">TBC fields updated. All vendors notified.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {tbcFields.length === 0 && (
            <p className="text-sm text-ink-500 text-center py-4">No TBC fields with dropdown options remaining.</p>
          )}
          {tbcFields.map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-ink-700 mb-2">{CHARTER_LABELS[field as keyof typeof CHARTER_LABELS]}</label>
              <select
                value={String(charter[field as keyof typeof charter])}
                onChange={(e) => resolveTbc(field, e.target.value)}
                className="w-full px-3.5 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              >
                {TBC_DROPDOWN_OPTIONS[field].map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ---- Scenario Analysis Modal ----
import { useVendorData } from '@/context/VendorDataContext';
import { rfp052Vendors } from '@/data/freightData';

interface VendorScenarioData {
  vendorId: string;
  vendorName: string;
  ratePerTon: number;
  freeDays: number;
  demurrageRate: number;
  questionnaireScore: 'full' | 'partial' | 'fail';
  isPast: boolean;
  confidence: number;
}

function parseRatePerTon(value: string): number {
  if (!value || value === 'NOT_FOUND') return 0;
  const match = value.match(/([\d,]+)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(/,/g, ''));
}

function parseFreeDays(value: string): number {
  if (!value || value === 'NOT_FOUND') return 0;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function parseDemurrageRate(value: string): number {
  if (!value || value === 'NOT_FOUND') return 0;
  const match = value.match(/([\d,]+)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(/,/g, ''));
}

function buildVendorScenarioData(vendors: Record<string, import('@/context/VendorDataContext').ExtractedVendor>): VendorScenarioData[] {
  return Object.values(vendors)
    .filter((v) => v.fields.length > 0)
    .map((v) => {
      const totalRate = v.fields.find((f) => f.field_name === 'Total Rate/Ton');
      const freeDays = v.fields.find((f) => f.field_name === 'Free Days');
      const demurrage = v.fields.find((f) => f.field_name === 'Demurrage Rate (PDPR)');
      const staticVendor = rfp052Vendors.find((sv) => sv.id === v.vendorId);
      const avgConf = v.fields.length > 0 ? v.fields.reduce((s, f) => s + f.confidence, 0) / v.fields.length : 0;

      return {
        vendorId: v.vendorId,
        vendorName: v.vendorName.split(' ')[0],
        ratePerTon: parseRatePerTon(totalRate?.value || ''),
        freeDays: parseFreeDays(freeDays?.value || ''),
        demurrageRate: parseDemurrageRate(demurrage?.value || ''),
        questionnaireScore: staticVendor?.questionnaireScore || 'fail',
        isPast: staticVendor?.badge?.includes('Past') || false,
        confidence: avgConf,
      };
    })
    .filter((v) => v.ratePerTon > 0);
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  if (k === arr.length) return [arr];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function ScenarioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { vendors } = useVendorData();
  const [splitCount, setSplitCount] = useState(2);
  const [passedOnly, setPassedOnly] = useState(false);
  const [pastOnly, setPastOnly] = useState(false);
  const [demurrage, setDemurrage] = useState(24);
  const [hasRun, setHasRun] = useState(false);

  const vendorData = buildVendorScenarioData(vendors);

  const filteredVendors = vendorData.filter((v) => {
    if (passedOnly && v.questionnaireScore !== 'full') return false;
    if (pastOnly && !v.isPast) return false;
    return true;
  });

  const combos = combinations(filteredVendors, splitCount);

  const results = combos.map((combo) => {
    const totalVolume = 30;
    const perVendorVolume = totalVolume / combo.length;
    let totalCost = 0;
    const riskNotes: string[] = [];

    combo.forEach((v) => {
      const baseCost = v.ratePerTon * perVendorVolume;
      const demurrageHours = Math.max(0, demurrage - 24 * v.freeDays);
      const demurrageCost = demurrageHours * (v.demurrageRate / 24);
      totalCost += baseCost + demurrageCost;

      if (v.confidence < 0.5) riskNotes.push(`${v.vendorName}: high extraction risk`);
      if (v.questionnaireScore === 'partial') riskNotes.push(`${v.vendorName}: partial questionnaire`);
      if (v.questionnaireScore === 'fail') riskNotes.push(`${v.vendorName}: failed questionnaire`);
      if (v.freeDays < 14) riskNotes.push(`${v.vendorName}: only ${v.freeDays} free days`);
    });

    return {
      combo,
      totalCost,
      riskNotes: riskNotes.length > 0 ? riskNotes.join('; ') : 'All vendors compliant',
    };
  });

  results.sort((a, b) => a.totalCost - b.totalCost);
  const topResults = results.slice(0, 3);
  const lowestCost = topResults.length > 0 ? topResults[0].totalCost : 0;

  const comboLabel = (combo: VendorScenarioData[]) => {
    const names = combo.map((v) => v.vendorName).join(' + ');
    return `${combo.length}-vendor split: ${names}`;
  };

  return (
    <Modal open={open} onClose={onClose} title="Run Scenario Analysis" subtitle="RFP-052 · Specialty Rice → Denmark" size="lg">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">Number of vendors to split award across</label>
          <select
            value={splitCount}
            onChange={(e) => { setSplitCount(Number(e.target.value)); setHasRun(false); }}
            className="w-full px-3.5 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            <option value={1}>1 (single award)</option>
            <option value={2}>2 (split award)</option>
            <option value={3}>3 (split award)</option>
          </select>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={passedOnly} onChange={(e) => { setPassedOnly(e.target.checked); setHasRun(false); }} className="accent-primary-500 w-4 h-4" />
          <span className="text-sm text-ink-700">Only include vendors who passed the full questionnaire (8/8)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={pastOnly} onChange={(e) => { setPastOnly(e.target.checked); setHasRun(false); }} className="accent-primary-500 w-4 h-4" />
          <span className="text-sm text-ink-700">Only include past vendors</span>
        </label>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-ink-700">Demurrage hours at discharge (0–72)</label>
            <span className="px-2.5 py-0.5 rounded-md bg-primary-100 text-primary-700 text-sm font-bold tabular-nums">{demurrage}h</span>
          </div>
          <input type="range" min={0} max={72} value={demurrage} onChange={(e) => { setDemurrage(Number(e.target.value)); setHasRun(false); }} className="w-full" />
        </div>
        <button onClick={() => setHasRun(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition shadow-pop">
          Run Analysis
        </button>
        <div className="border-t border-ink-200 pt-4 min-h-[80px]">
          {!hasRun ? (
            <p className="text-sm text-ink-400 text-center py-8">Run the analysis to see ranked results.</p>
          ) : topResults.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-8">No valid vendor combinations found with current filters. Try adjusting filters.</p>
          ) : (
            <div className="space-y-3 animate-slide-up">
              <div className="overflow-hidden rounded-lg border border-ink-200">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-xs text-ink-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Combination</th>
                      <th className="px-3 py-2 text-right font-medium">Total Cost</th>
                      <th className="px-3 py-2 text-left font-medium">Risk Notes</th>
                      <th className="px-3 py-2 text-left font-medium">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {topResults.map((r, i) => (
                      <tr key={i} className={i === 0 ? 'bg-good-50/50' : ''}>
                        <td className="px-3 py-3 font-medium text-ink-800">{comboLabel(r.combo)}</td>
                        <td className="px-3 py-3 text-right font-bold text-ink-800">{formatINR(Math.round(r.totalCost))}</td>
                        <td className="px-3 py-3 text-xs text-ink-600">{r.riskNotes}</td>
                        <td className="px-3 py-3">
                          {i === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-good-100 text-good-700 text-xs font-semibold">Recommended</span>
                          ) : (
                            <span className="text-xs text-ink-500">Alternative</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {topResults.length >= 2 && (
                <p className="text-xs text-ink-500 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-warn-500 mt-0.5 shrink-0" />
                  At {demurrage} demurrage hours, the recommended split saves {formatINR(Math.round(topResults[1].totalCost - topResults[0].totalCost))} vs the next-best alternative.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---- Questionnaire Compliance Modal ----
import { questionnaireQuestions, questionnaireVendors, questionnaireMatrix } from '@/data/freightData';

export function QuestionnaireModal({ open, onClose, filterVendor }: { open: boolean; onClose: () => void; filterVendor?: string | null }) {
  const cellSymbol = { full: '✓', partial: '⚠', fail: '✗' };
  const cellClass = {
    full: 'bg-good-50 text-good-600',
    partial: 'bg-warn-50 text-warn-600',
    fail: 'bg-bad-50 text-bad-600',
  };

  const filteredVendorIdx = filterVendor
    ? questionnaireVendors.findIndex((v) => v.toLowerCase().replace(/\s/g, '-') === filterVendor)
    : -1;

  const visibleVendors = filteredVendorIdx >= 0 ? [questionnaireVendors[filteredVendorIdx]] : questionnaireVendors;
  const visibleIndices = filteredVendorIdx >= 0 ? [filteredVendorIdx] : questionnaireVendors.map((_, i) => i);

  return (
    <Modal open={open} onClose={onClose} title="Questionnaire Compliance — RFP-052" subtitle="Vendor compliance matrix across 8 questions" size="xl">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-ink-500 uppercase bg-ink-50 rounded-tl-lg sticky left-0 bg-ink-50">Question</th>
              {visibleVendors.map((v) => (
                <th key={v} className="px-3 py-2.5 text-xs font-semibold text-ink-700 text-center bg-ink-50 min-w-[90px]">{v}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {questionnaireQuestions.map((q, qi) => (
              <tr key={q} className="hover:bg-ink-50/50">
                <td className="px-3 py-2.5 text-sm text-ink-700 font-medium">{q}</td>
                {visibleIndices.map((vi) => {
                  const val = questionnaireMatrix[qi][vi];
                  return (
                    <td key={vi} className="px-3 py-2.5 text-center">
                      <span className={`inline-flex w-7 h-7 items-center justify-center rounded-md text-sm font-bold ${cellClass[val]}`}>
                        {cellSymbol[val]}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-3.5 rounded-lg bg-warn-50 border border-warn-100">
        <div className="text-xs font-semibold text-warn-700 mb-1.5">Risk Legend</div>
        <ul className="text-xs text-warn-700/90 space-y-1">
          <li>• Missing fumigation cert = port delay risk.</li>
          <li>• Missing EU phyto = customs hold risk at Copenhagen.</li>
          <li>• Missing on-time rate = no reliability baseline.</li>
        </ul>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-good-50 text-good-600 flex items-center justify-center font-bold">✓</span> Full</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-warn-50 text-warn-600 flex items-center justify-center font-bold">⚠</span> Partial</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-bad-50 text-bad-600 flex items-center justify-center font-bold">✗</span> Missing</span>
      </div>
    </Modal>
  );
}
