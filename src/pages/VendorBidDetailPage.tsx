import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, Download, ExternalLink, Sparkles, AlertTriangle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { rfp052Vendors, charterGroupNames } from '@/data/freightData';
import { useVendorData, type ExtractedField } from '@/context/VendorDataContext';
import { BackButton, PrimaryButton, OutlineButton, ActionButton } from '@/components/ui';
import { ApproveModal, ClarifyModal, DeclineModal } from '@/components/RfpModals';
import { LowConfidenceModal } from '@/components/LowConfidenceModal';

const sourceIconMap: Record<string, string> = { pdf: '📄', csv: '📊', docx: '📝', jpg: '📷', txt: '✉️' };

function confidenceBadge(conf: number) {
  if (conf >= 0.8) return { class: 'bg-good-100 text-good-700', label: conf.toFixed(2) };
  if (conf >= 0.5) return { class: 'bg-warn-100 text-warn-700', label: conf.toFixed(2) };
  return { class: 'bg-bad-100 text-bad-700', label: conf === 0 ? '0.00' : conf.toFixed(2) };
}

const FIELD_GROUPS: Record<number, string[]> = {
  1: ['Ocean Freight', 'BAF', 'THC Origin', 'THC Destination', 'Documentation', 'BL+ISPS', 'Total Rate/Ton', 'Rate per Container', 'Currency', 'Rate Validity'],
  2: ['Vessel Name', 'Vessel DWT', 'Vessel Flag', 'Laycan Start', 'Laycan End', 'Transit Time', 'Load Rate (MT/day)', 'Discharge Rate (MT/day)'],
  3: ['Free Days', 'Demurrage Rate (PDPR)', 'Dispatch Rate', 'Laytime Allowance', 'NOR Clause', 'Payment Terms', 'Volume Discount Threshold'],
  4: ['Fumigation Certificate (Y/N)', 'Phytosanitary Certificate (Y/N)', 'Hold Cleanliness Standard', 'Stowage Factor', 'Container Type/Count'],
};

const pastTransactions: Record<string, { rfp: string; route: string; value: string; date: string; status: string }[]> = {
  'oceanlink': [
    { rfp: 'RFP-045', route: 'Coffee Beans → Hamburg', value: '₹6.8L', date: 'Aug 2026', status: 'Awarded' },
    { rfp: 'RFP-029', route: 'Bagged Rice → Dammam', value: '₹3.1L', date: 'Jun 2026', status: 'Completed' },
    { rfp: 'RFP-021', route: 'Cotton → Rotterdam', value: '₹9.2L', date: 'Mar 2026', status: 'Completed' },
  ],
  'gulf-freight': [
    { rfp: 'RFP-038', route: 'Raw Cotton → Mombasa', value: '₹18.6L', date: 'Jul 2026', status: 'Completed' },
    { rfp: 'RFP-015', route: 'Basmati Rice → Dubai', value: '₹4.5L', date: 'Feb 2026', status: 'Completed' },
  ],
  'indoship': [
    { rfp: 'RFP-041', route: 'Basmati Rice → Dubai', value: '₹4.2L', date: 'Aug 2026', status: 'Completed' },
    { rfp: 'RFP-025', route: 'Cotton → Mombasa', value: '₹7.1L', date: 'Apr 2026', status: 'Completed' },
  ],
  'nordic-freight': [
    { rfp: 'RFP-033', route: 'Specialty Cocoa → Rotterdam', value: '₹5.4L', date: 'Jul 2026', status: 'Completed' },
    { rfp: 'RFP-019', route: 'Coffee → Hamburg', value: '₹8.3L', date: 'Mar 2026', status: 'Completed' },
  ],
  'swiftsea': [],
  'maersk': [],
};

const aiRemarks: Record<string, string> = {
  'oceanlink': 'Strong bid. Rate is in line with past performance and current market range. Full questionnaire compliance (8/8) and low extraction risk from CSV. Recommended for approval.',
  'gulf-freight': 'Three concerns: (1) USD-denominated rate creates FX exposure; (2) demurrage rate may be in a PDF footnote — verify confidence; (3) missing EU phytosanitary certificate risks customs hold. Send clarification before proceeding.',
  'indoship': 'All-in rate structure from Word document — no component breakdown provided. Medium confidence extraction. Clarify rate breakdown.',
  'nordic-freight': 'Fastest transit and low risk, but rate is above average. Good option if transit time is prioritized over cost.',
  'swiftsea': 'High risk: photo-based submission with OCR extraction, low free days, missing compliance certificates, no track record. Not recommended without significant clarification.',
  'maersk': 'Premium carrier with highest rate but excellent transit and 21 free days. Low extraction risk from CSV. Good fallback if reliability is prioritized.',
  'transocean': 'Bid is 2 days overdue. Reminder has been sent. No data available for analysis yet.',
  'sealand': 'Declined — no Denmark service coverage. No further action needed.',
};

const issues: Record<string, { title: string; author: string; text: string; time: string; replies?: { author: string; text: string; time: string }[] }[]> = {
  'gulf-freight': [
    { title: 'USD currency conversion', author: 'FreightIQ AI', text: 'Rate is quoted in USD. Conversion to INR adds FX risk.', time: '2h ago', replies: [{ author: 'Ishita S.', text: 'Agreed, let us ask them for an INR all-in rate.', time: '1h ago' }] },
    { title: 'Demurrage in footnote', author: 'FreightIQ AI', text: 'Demurrage rate may be in a PDF footnote. Needs manual verification.', time: '3h ago' },
  ],
  'indoship': [{ title: 'All-in rate ambiguity', author: 'FreightIQ AI', text: 'Rate is quoted as all-in with no BAF/THC breakdown.', time: '4h ago' }],
  'swiftsea': [
    { title: 'OCR extraction issues', author: 'FreightIQ AI', text: 'Fields unreadable from photo submission. Demurrage rate not found.', time: '5h ago' },
    { title: 'Only 7 free days', author: 'FreightIQ AI', text: '7 free days is below the 14-day requirement.', time: '5h ago' },
    { title: 'Missing compliance documents', author: 'FreightIQ AI', text: 'Fumigation, phytosanitary, and on-time rate not provided.', time: '6h ago' },
  ],
};

export default function VendorBidDetailPage() {
  const { id: vendorId } = useParams();
  const navigate = useNavigate();
  const { vendors, loading, corrections, applyCorrection, getVendorFields } = useVendorData();

  const extractedVendor = vendors[vendorId || ''];
  const useExtracted = extractedVendor && extractedVendor.extracted;
  const vendor = (!useExtracted ? rfp052Vendors.find((v) => v.id === vendorId) : null) || rfp052Vendors.find((v) => v.id === vendorId) || rfp052Vendors[0];
  const extractedFields = getVendorFields(vendor.id);
  const vendorCorrections = corrections[vendor.id] || [];

  const [openGroups, setOpenGroups] = useState<number[]>([1]);
  const [modal, setModal] = useState<{ type: string; vendor: typeof vendor } | null>(null);
  const [lowConfField, setLowConfField] = useState<ExtractedField | null>(null);
  const [issueInput, setIssueInput] = useState('');
  const [issueThreads, setIssueThreads] = useState<Record<string, { author: string; text: string; time: string }[]>>({});

  const pastRfps = pastTransactions[vendor.id] || [];
  const vendorIssues = issues[vendor.id] || [];

  const toggleGroup = (g: number) => setOpenGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  const groups = [1, 2, 3, 4];

  // Map extracted fields to group structure
  const getFieldsForGroup = (groupNum: number): ExtractedField[] => {
    const fieldNames = FIELD_GROUPS[groupNum];
    return fieldNames.map((name) => {
      const found = extractedFields.find((f) => f.field_name === name);
      const corrected = vendorCorrections.find((c) => c.fieldName === name);
      if (corrected) {
        return { ...found, field_name: name, value: corrected.correctedValue, confidence: 1.0, notes: 'Manually corrected by buyer', source_snippet: found?.source_snippet || '', source_location: found?.source_location || '' } as ExtractedField;
      }
      return found || { field_name: name, value: 'NOT_FOUND', confidence: 0, source_snippet: '', source_location: '', notes: 'Not found' };
    });
  };

  // Build rate breakdown from Group 1 fields
  const rateBreakdownFields = extractedFields.length > 0 ? getFieldsForGroup(1) : vendor.rateComponents.map((rc) => ({ field_name: rc.label, value: rc.value, confidence: 1, source_snippet: '', source_location: '', notes: '' } as ExtractedField));

  const isFieldCorrected = (fieldName: string) => vendorCorrections.some((c) => c.fieldName === fieldName);

  return (
    <div className="px-8 py-6">
      <BackButton to="/bids/052" label="Back to RFP-052" />

      {/* Vendor header */}
      <div className="flex items-start justify-between gap-4 mt-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">{vendor.name}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            {vendor.badge && <span className="text-sm text-ink-500">{vendor.badge}</span>}
            <span className="text-ink-300">·</span>
            <span className="text-sm text-ink-500">RFP-052</span>
            <span className="px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-xs font-medium">Bid Received</span>
            {extractedVendor && !extractedVendor.extracted && <span className="px-2 py-0.5 rounded-md bg-warn-100 text-warn-700 text-xs font-medium">Extraction Failed</span>}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <ActionButton tone="good" onClick={() => setModal({ type: 'approve', vendor })}>Approve</ActionButton>
          <ActionButton tone="warn" onClick={() => setModal({ type: 'clarify', vendor })}>Clarify</ActionButton>
          <ActionButton tone="bad" onClick={() => setModal({ type: 'decline', vendor })}>Decline</ActionButton>
          <PrimaryButton onClick={() => navigate('/bids/052/analyst')}>
            <Sparkles className="w-4 h-4" /> Ask Analyst
          </PrimaryButton>
          <OutlineButton onClick={() => navigate('/bids/052')}>Back</OutlineButton>
        </div>
      </div>

      {/* Extraction loading */}
      {loading && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin shrink-0" />
          <span className="text-sm text-primary-700">Extracting fields from vendor document…</span>
        </div>
      )}

      {/* Past transactions panel */}
      {pastRfps.length > 0 && (
        <div className="mb-5 rounded-xl bg-primary-50 border border-primary-100 p-4">
          <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-3">Past Transactions with {vendor.name}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pastRfps.map((tx) => (
              <div key={tx.rfp} className="bg-white rounded-lg p-3 border border-primary-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-primary-700">{tx.rfp}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-good-100 text-good-700 font-medium">{tx.status}</span>
                </div>
                <div className="text-sm text-ink-700">{tx.route}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-semibold text-ink-800">{tx.value}</span>
                  <span className="text-xs text-ink-400">{tx.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Left: bid detail */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-ink-200 shadow-card p-5">
          <h2 className="text-sm font-semibold text-ink-700 mb-4">Bid Details — Rate Breakdown</h2>
          <div className="space-y-0">
            {rateBreakdownFields.map((f, i) => (
              <div key={f.field_name} className={`flex items-center justify-between py-2.5 ${i < rateBreakdownFields.length - 1 ? 'border-b border-ink-100' : ''}`}>
                <span className="text-sm text-ink-500">{f.field_name}</span>
                <div className="flex items-center gap-2">
                  {isFieldCorrected(f.field_name) && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-good-100 text-good-700">Corrected</span>}
                  <span className={`text-sm font-semibold ${f.value === 'NOT_FOUND' ? 'text-bad-600' : 'text-ink-800'}`}>{f.value}</span>
                  {extractedFields.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded ${f.confidence >= 0.8 ? 'bg-good-50 text-good-600' : f.confidence >= 0.5 ? 'bg-warn-50 text-warn-600' : 'bg-bad-50 text-bad-600'}`}>{f.confidence.toFixed(2)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: documents */}
        <div className="bg-white rounded-xl border border-ink-200 shadow-card p-5">
          <h2 className="text-sm font-semibold text-ink-700 mb-4">Uploaded Documents</h2>
          <div className="space-y-2.5">
            {extractedVendor && (
              <DocItem name={getDocumentName(vendor.id)} size={getSourceSize(extractedVendor.sourceType)} sourceType={extractedVendor.sourceType} />
            )}
            {!extractedVendor && vendor.format === 'Excel' && <DocItem name="Bid_File.xlsx" size="142 KB" sourceType="csv" />}
            {!extractedVendor && vendor.format === 'PDF' && <DocItem name="Bid_File.pdf" size="1.8 MB" sourceType="pdf" />}
            {!extractedVendor && vendor.format === 'Word' && <DocItem name="Bid_File.docx" size="86 KB" sourceType="docx" />}
            {!extractedVendor && vendor.format === 'Photo' && <DocItem name="Bid_File.jpg" size="3.2 MB" sourceType="jpg" />}
          </div>
        </div>
      </div>

      {/* AI Remarks */}
      <div className="mb-5 bg-white rounded-xl border border-ink-200 shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-ink-700">AI Remarks</h2>
        </div>
        <p className="text-sm text-ink-600 leading-relaxed">{aiRemarks[vendor.id] || 'No remarks available.'}</p>
      </div>

      {/* Issues */}
      <div className="mb-5 bg-white rounded-xl border border-ink-200 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-warn-600" />
          <h2 className="text-sm font-semibold text-ink-700">Issues & Discussion</h2>
          {vendorIssues.length > 0 && <span className="px-2 py-0.5 rounded-md bg-warn-100 text-warn-700 text-xs font-medium">{vendorIssues.length} open</span>}
        </div>
        {vendorIssues.length === 0 ? (
          <p className="text-sm text-ink-400 py-4 text-center">No issues flagged for this vendor.</p>
        ) : (
          <div className="space-y-4">
            {vendorIssues.map((issue, i) => (
              <div key={i} className="rounded-lg border border-ink-200 overflow-hidden">
                <div className="px-4 py-3 bg-ink-50 border-b border-ink-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-800">{issue.title}</span>
                    <span className="text-xs text-ink-400">{issue.time}</span>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${issue.author === 'FreightIQ AI' ? 'bg-primary-100 text-primary-700' : 'bg-ink-200 text-ink-600'}`}>
                      {issue.author === 'FreightIQ AI' ? 'AI' : 'IS'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-ink-400 mb-0.5">{issue.author}</div>
                      <p className="text-sm text-ink-700">{issue.text}</p>
                    </div>
                  </div>
                  {issue.replies?.map((reply, ri) => (
                    <div key={ri} className="flex items-start gap-2.5 pl-6">
                      <div className="w-7 h-7 rounded-full bg-ink-200 text-ink-600 flex items-center justify-center text-xs font-semibold shrink-0">IS</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-ink-400 mb-0.5">{reply.author}</div>
                        <p className="text-sm text-ink-700">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                  {(issueThreads[issue.title] || []).map((reply, ri) => (
                    <div key={ri} className="flex items-start gap-2.5 pl-6">
                      <div className="w-7 h-7 rounded-full bg-ink-200 text-ink-600 flex items-center justify-center text-xs font-semibold shrink-0">IS</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-ink-400 mb-0.5">{reply.author}</div>
                        <p className="text-sm text-ink-700">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pl-6">
                    <input type="text" value={issueInput} onChange={(e) => setIssueInput(e.target.value)} placeholder="Reply…" className="flex-1 px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                      onKeyDown={(e) => { if (e.key === 'Enter' && issueInput.trim()) { setIssueThreads((prev) => ({ ...prev, [issue.title]: [...(prev[issue.title] || []), { author: 'Ishita S.', text: issueInput.trim(), time: 'just now' }] })); setIssueInput(''); } }}
                    />
                    <button onClick={() => { if (issueInput.trim()) { setIssueThreads((prev) => ({ ...prev, [issue.title]: [...(prev[issue.title] || []), { author: 'Ishita S.', text: issueInput.trim(), time: 'just now' }] })); setIssueInput(''); } }}
                      className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 30-Field Charter Party Breakdown */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-700">Charter Party Breakdown</h2>
            <p className="text-xs text-ink-400 mt-0.5">30 fields extracted from bid documents · grouped by category</p>
          </div>
          {extractedVendor && (
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${extractedVendor.extracted ? 'bg-good-50 text-good-700' : 'bg-warn-50 text-warn-700'}`}>
              {extractedVendor.extracted ? `${extractedFields.filter((f) => f.value !== 'NOT_FOUND').length}/30 fields found` : 'Extraction failed'}
            </span>
          )}
        </div>
        <div className="divide-y divide-ink-100">
          {groups.map((g) => {
            const fields = getFieldsForGroup(g);
            const isOpen = openGroups.includes(g);
            return (
              <div key={g}>
                <button onClick={() => toggleGroup(g)} className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-ink-50 transition text-left">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-ink-500" /> : <ChevronRight className="w-4 h-4 text-ink-500" />}
                  <span className="text-sm font-semibold text-ink-800">Group {g} — {charterGroupNames[g]}</span>
                  <span className="text-xs text-ink-400 ml-auto">{fields.length} fields</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 animate-slide-up">
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-ink-400 uppercase tracking-wide">
                          <tr className="border-b border-ink-100">
                            <th className="text-left py-2 font-medium">Field Name</th>
                            <th className="text-left py-2 font-medium">Value</th>
                            <th className="text-left py-2 font-medium">Confidence</th>
                            <th className="text-left py-2 font-medium">Source</th>
                            <th className="text-right py-2 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-50">
                          {fields.map((f) => {
                            const cb = confidenceBadge(f.confidence);
                            const corrected = isFieldCorrected(f.field_name);
                            return (
                              <tr key={f.field_name} className={`hover:bg-ink-50/50 ${corrected ? 'bg-good-50/30' : ''}`}>
                                <td className="py-2.5 text-ink-700 font-medium">{f.field_name}</td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-2">
                                    {corrected && <CheckCircle2 className="w-3.5 h-3.5 text-good-600 shrink-0" />}
                                    <span className={f.value === 'NOT_FOUND' ? 'text-bad-600 font-medium' : corrected ? 'text-good-700 font-semibold' : 'text-ink-800'}>{f.value}</span>
                                    {corrected && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-good-100 text-good-700">Corrected</span>}
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${cb.class}`}>{cb.label}</span>
                                </td>
                                <td className="py-2.5 text-xs text-ink-500">
                                  {extractedVendor && <span className="mr-1">{sourceIconMap[extractedVendor.sourceType]}</span>}
                                  {f.source_location || f.source_snippet?.slice(0, 40) || '—'}
                                </td>
                                <td className="py-2.5 text-right">
                                  {f.confidence < 0.8 && f.value !== 'NOT_FOUND' && (
                                    <button onClick={() => setLowConfField(f)} className="px-2.5 py-1 text-xs font-semibold rounded-md bg-warn-50 text-warn-700 hover:bg-warn-100 transition">Review</button>
                                  )}
                                  {f.value === 'NOT_FOUND' && (
                                    <button onClick={() => setLowConfField(f)} className="px-2.5 py-1 text-xs font-semibold rounded-md bg-bad-50 text-bad-700 hover:bg-bad-100 transition">Review</button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <ApproveModal open={modal?.type === 'approve'} onClose={() => setModal(null)} vendorName={vendor.name} />
      <ClarifyModal open={modal?.type === 'clarify'} onClose={() => setModal(null)} vendorName={vendor.name} />
      <DeclineModal open={modal?.type === 'decline'} onClose={() => setModal(null)} vendorName={vendor.name} />
      {lowConfField && (
        <LowConfidenceModal
          open={!!lowConfField}
          onClose={() => setLowConfField(null)}
          field={convertToCharterField(lowConfField, extractedVendor?.sourceType || '')}
          vendorName={vendor.name}
          onCorrect={(newValue) => {
            applyCorrection(vendor.id, lowConfField.field_name, newValue);
            setLowConfField(null);
          }}
        />
      )}
    </div>
  );
}

function convertToCharterField(f: ExtractedField, sourceType: string) {
  const sourceTypeEnum = sourceType as 'pdf' | 'excel' | 'word' | 'photo' | 'email';
  return {
    name: f.field_name,
    value: f.value,
    confidence: f.confidence,
    source: f.source_location || f.source_snippet || '',
    sourceType: sourceTypeEnum || 'pdf',
    group: 1 as 1 | 2 | 3 | 4,
  };
}

function getDocumentName(vendorId: string): string {
  const map: Record<string, string> = {
    'oceanlink': 'OceanLink_Quote_RFP052.csv',
    'gulf-freight': 'Gulf_Freight_Quote_RFP052.pdf',
    'indoship': 'IndoShip_Quote_RFP052.docx',
    'swiftsea': 'SwiftSea_RateCard.jpg',
    'transocean': 'TransOcean_Email_RFP052.txt',
    'maersk': 'Maersk_Quote_RFP052.csv',
  };
  return map[vendorId] || 'Unknown';
}

function getSourceSize(sourceType: string): string {
  const map: Record<string, string> = { csv: '645 B', pdf: '25 KB', docx: '14 KB', jpg: '455 KB', txt: '790 B' };
  return map[sourceType] || '—';
}

function DocItem({ name, size, sourceType }: { name: string; size: string; sourceType: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-ink-200 hover:bg-ink-50 transition group">
      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        <span className="text-base">{sourceIconMap[sourceType] || '📄'}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink-800 truncate">{name}</div>
        <div className="text-xs text-ink-400">{size}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
        <button className="w-7 h-7 rounded-md hover:bg-ink-200 flex items-center justify-center text-ink-500"><ExternalLink className="w-3.5 h-3.5" /></button>
        <button className="w-7 h-7 rounded-md hover:bg-ink-200 flex items-center justify-center text-ink-500"><Download className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
