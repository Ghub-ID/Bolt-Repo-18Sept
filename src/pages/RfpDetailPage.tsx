import { useState, Fragment, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, AlertTriangle, GitBranch, ClipboardCheck, Download, Share2, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { rfp052Vendors, charterFieldsForVendor, charterGroupNames, type VendorRow } from '@/data/freightData';
import { useVendorData, VENDOR_FILE_NAMES, VENDOR_FILES, CACHE_KEY } from '@/context/VendorDataContext';
import { useNormalizedVendors, useVendorCount } from '@/hooks/useNormalizedVendors';
import { BackButton, PrimaryButton, OutlineButton, ActionButton } from '@/components/ui';
import { ApproveModal, ClarifyModal, DeclineModal, ShareModal, TbcModal, ScenarioModal, QuestionnaireModal } from '@/components/RfpModals';
import { useRfpCharter, CHARTER_LABELS } from '@/context/RfpCharterContext';

const toneText: Record<string, string> = {
  good: 'text-good-600',
  warn: 'text-warn-600',
  bad: 'text-bad-600',
  neutral: 'text-ink-600',
};

function QuestionnaireBadge({ score, label, onClick }: { score: 'full' | 'partial' | 'fail'; label: string; onClick: () => void }) {
  const map = {
    full: { class: 'bg-good-50 text-good-700 hover:bg-good-100', symbol: '✓' },
    partial: { class: 'bg-warn-50 text-warn-700 hover:bg-warn-100', symbol: '⚠' },
    fail: { class: 'bg-bad-50 text-bad-700 hover:bg-bad-100', symbol: '✗' },
  };
  const s = map[score];
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition ${s.class}`}>
      {label} <span className="font-bold">{s.symbol}</span>
    </button>
  );
}

export default function RfpDetailPage() {
  const navigate = useNavigate();
  const { loading, anyFailed, retry } = useVendorData();
  const { charter, tbcCount } = useRfpCharter();
  const normalizedVendors = useNormalizedVendors();
  const counts = useVendorCount();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: string; vendor?: VendorRow } | null>(null);
  const [tbcOpen, setTbcOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [questionnaireFilter, setQuestionnaireFilter] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const openQuestionnaireForVendor = (vendorName: string) => {
    setQuestionnaireFilter(vendorName.toLowerCase().replace(/\s/g, '-'));
    setQuestionnaireOpen(true);
  };

  const openQuestionnaireGeneral = () => {
    setQuestionnaireFilter(null);
    setQuestionnaireOpen(true);
  };

  const toggleExpand = useCallback((vendorId: string) => {
    setExpanded((prev) => (prev === vendorId ? null : vendorId));
  }, []);

  const handleReextract = () => {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem('freightiq_corrections');
    retry();
  };

  const handleExport = () => {
    const today = new Date().toISOString().split('T')[0];
    const fileName = `FreightIQ_RFP-052_Comparison_${today}.xlsx`;

    // Sheet 1: Comparison table
    const comparisonData = normalizedVendors.map((v) => {
      const staticVendor = rfp052Vendors.find((sv) => sv.id === v.vendorId);
      return {
        Vendor: v.vendorName,
        'Rate/Ton': v.rate === 'NOT_FOUND' ? 'Pending' : v.rate,
        Transit: v.transit,
        'Free Days': v.freeDays,
        Questionnaire: staticVendor?.questionnaire || '—',
        Format: v.format,
        Confidence: v.confidence,
        Benchmarking: staticVendor?.benchmark || '—',
        Issues: staticVendor?.issues || '—',
      };
    });
    // Add static non-extracted vendors
    rfp052Vendors.filter((v) => v.status === 'pending' || v.status === 'declined').forEach((v) => {
      comparisonData.push({
        Vendor: v.name,
        'Rate/Ton': v.rate,
        Transit: v.transit,
        'Free Days': v.freeDays,
        Questionnaire: v.questionnaire,
        Format: v.format,
        Confidence: v.confidence,
        Benchmarking: v.benchmark,
        Issues: v.issues,
      });
    });

    const ws1 = XLSX.utils.json_to_sheet(comparisonData);

    // Sheet 2: 30 charter party fields per vendor
    const charterData: Record<string, string>[] = [];
    const activeVendorIds = ['oceanlink', 'gulf-freight', 'indoship', 'swiftsea', 'maersk', 'transocean'];
    activeVendorIds.forEach((vid) => {
      const fields = charterFieldsForVendor(vid);
      fields.forEach((f) => {
        charterData.push({
          Vendor: rfp052Vendors.find((v) => v.id === vid)?.name || vid,
          Group: charterGroupNames[f.group],
          Field: f.name,
          Value: f.value,
          Confidence: f.confidence.toFixed(2),
          Source: f.source,
        });
      });
    });
    const ws2 = XLSX.utils.json_to_sheet(charterData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Comparison');
    XLSX.utils.book_append_sheet(wb, ws2, 'Charter Party Fields');
    XLSX.writeFile(wb, fileName);
  };

  const normalizedVendorsForTable = normalizedVendors.filter((v) => VENDOR_FILES.some((f) => f.vendorId === v.vendorId));
  const pendingOrDeclined = rfp052Vendors.filter((v) => v.status === 'pending' || v.status === 'declined');

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-5">
        <BackButton to="/bids" label="Back to Bids" />
        <div className="flex items-start justify-between gap-4 mt-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink-900 tracking-tight">RFP-052 · Specialty Rice → Denmark</h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-ink-500">
              <span>{charter.volume}</span>
              <span className="text-ink-300">·</span>
              <span>Mundra, IN → Denmark (TBC)</span>
              <span className="text-ink-300">·</span>
              <span>Oct 5 – Oct 20, 2026</span>
              <span className="text-ink-300">·</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-xs font-medium">Open</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <PrimaryButton onClick={() => navigate(`/bids/052/analyst`)} className="!py-3 !px-5">
              <Sparkles className="w-4.5 h-4.5" />
              Ask Analyst
            </PrimaryButton>
            <OutlineButton onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export Comparison
            </OutlineButton>
            <OutlineButton onClick={() => setShareOpen(true)}>
              <Share2 className="w-4 h-4" />
              Share
            </OutlineButton>
          </div>
        </div>
      </div>

      {/* Extraction status banner */}
      {loading && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin shrink-0" />
          <span className="text-sm text-primary-700">Extracting vendor bid data from uploaded files…</span>
          <span className="ml-auto text-xs text-primary-500">{counts.extracted}/{counts.total} done</span>
        </div>
      )}
      {anyFailed && !loading && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-warn-50 border border-warn-100">
          <AlertTriangle className="w-5 h-5 text-warn-600 shrink-0" />
          <span className="text-sm text-warn-700">Extraction failed for all vendors — showing fallback data.</span>
          <button onClick={retry} className="ml-auto px-3.5 py-1.5 bg-warn-500 text-white text-sm font-semibold rounded-lg hover:bg-warn-600 transition shrink-0">
            Retry?
          </button>
        </div>
      )}

      {/* TBC Banner */}
      {tbcCount > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-warn-50 border border-warn-100">
          <AlertTriangle className="w-5 h-5 text-warn-600 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium text-warn-700">{tbcCount} {tbcCount === 1 ? 'field is' : 'fields are'} still TBC</span>
            <span className="text-sm text-warn-600/80 ml-2">— {charter.tbc_fields.map((f) => CHARTER_LABELS[f as keyof typeof CHARTER_LABELS] || f).join(', ')} need confirmation before awarding.</span>
          </div>
          <button onClick={() => setTbcOpen(true)} className="px-3.5 py-1.5 bg-warn-500 text-white text-sm font-semibold rounded-lg hover:bg-warn-600 transition shrink-0">
            Update TBC Fields
          </button>
        </div>
      )}

      {/* Extraction status banner */}
      {!loading && counts.total > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-ink-50 border border-ink-200">
          <span className={`w-2 h-2 rounded-full shrink-0 ${counts.failed === 0 ? 'bg-good-500' : 'bg-warn-500'}`} />
          <span className="text-sm text-ink-700">
            AI Extraction: {counts.extracted} of {counts.total} vendor files processed{counts.failed > 0 ? ` · ${counts.failed} using fallback` : ''}
          </span>
          <button onClick={handleReextract} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-ink-200 text-ink-700 text-sm font-semibold rounded-lg hover:bg-ink-50 transition shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Re-extract All
          </button>
        </div>
      )}

      {/* Secondary action row */}
      <div className="mb-4 flex items-center gap-2.5">
        <OutlineButton tone="primary" onClick={() => setScenarioOpen(true)}>
          <GitBranch className="w-4 h-4" />
          Run Scenario Analysis
        </OutlineButton>
        <OutlineButton tone="primary" onClick={openQuestionnaireGeneral}>
          <ClipboardCheck className="w-4 h-4" />
          Questionnaire Compliance
        </OutlineButton>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-200">
              <tr className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                <th className="px-3 py-3 w-8"></th>
                <th className="px-3 py-3 text-left">Vendor</th>
                <th className="px-3 py-3 text-left">Rate/Ton</th>
                <th className="px-3 py-3 text-left">Transit</th>
                <th className="px-3 py-3 text-left">Free Days</th>
                <th className="px-3 py-3 text-left">Questionnaire</th>
                <th className="px-3 py-3 text-left">Format</th>
                <th className="px-3 py-3 text-left">Confidence</th>
                <th className="px-3 py-3 text-left">Benchmarking</th>
                <th className="px-3 py-3 text-left">Issues</th>
                <th className="px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {/* Extracted vendors */}
              {normalizedVendorsForTable.map((v) => {
                const staticVendor = rfp052Vendors.find((sv) => sv.id === v.vendorId);
                const questionnaire = staticVendor?.questionnaire || '—';
                const questionnaireScore = staticVendor?.questionnaireScore || 'fail';
                const badge = staticVendor?.badge;

                const benchmark = 'In line with market standards';
                const benchmarkTone: 'good' | 'warn' | 'bad' | 'neutral' = 'neutral';

                let issues: string;
                let issuesTone: 'good' | 'warn' | 'bad' | 'neutral';
                if (v.extracted) {
                  const lowConfCount = v.fields.filter((f) => f.confidence < 0.7).length;
                  if (lowConfCount === 0) {
                    issues = '—';
                    issuesTone = 'good';
                  } else if (lowConfCount <= 2) {
                    issues = `${lowConfCount} issue${lowConfCount > 1 ? 's' : ''}`;
                    issuesTone = 'warn';
                  } else {
                    issues = `${lowConfCount} issues`;
                    issuesTone = 'bad';
                  }
                } else {
                  issues = staticVendor?.issues || '—';
                  issuesTone = staticVendor?.issuesTone || 'neutral';
                }
                const rateDisplay = v.rate === 'NOT_FOUND' ? 'Pending' : v.rate;
                const isExpanded = expanded === v.vendorId;

                const rateComponents = ['Ocean Freight', 'BAF', 'THC Origin', 'THC Destination', 'Documentation', 'BL+ISPS'];
                const sourceFile = VENDOR_FILE_NAMES[v.vendorId] || '—';

                return (
                  <Fragment key={v.vendorId}>
                    <tr
                      className={`hover:bg-ink-50/50 transition cursor-pointer ${isExpanded ? 'bg-ink-50/50' : ''} ${!v.extracted ? 'opacity-75' : ''}`}
                      onClick={() => toggleExpand(v.vendorId)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleExpand(v.vendorId)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-ink-100 transition">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-ink-500 transition-transform" /> : <ChevronRight className="w-4 h-4 text-ink-500 transition-transform" />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-ink-800">{v.vendorName.split(' ')[0]}</span>
                          {v.extracted ? (
                            <span title="AI extracted" className="text-xs">🤖</span>
                          ) : (
                            <span title={v.extractionError || 'No extraction attempted.'} className="text-xs cursor-help">📋</span>
                          )}
                        </div>
                        {badge && <div className="text-xs text-ink-400">{badge}</div>}
                      </td>
                      <td className={`px-3 py-3 ${toneText[v.rateTone]}`}>
                        <div>
                          <span className="font-medium">{rateDisplay}</span>
                          {v.originalCurrency === 'USD' && v.originalUsdAmount && v.fxRate && (
                            <div className="text-[10px] text-ink-400 mt-0.5">Converted from USD {v.originalUsdAmount} at ₹{v.fxRate}/USD</div>
                          )}
                          {v.rateNote && (
                            <div className="text-[10px] text-ink-400 mt-0.5">{v.rateNote}</div>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-3 ${toneText[v.transitTone]}`}>{v.transit}</td>
                      <td className={`px-3 py-3 ${toneText[v.freeDaysTone]}`}>{v.freeDays}</td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        {questionnaireScore !== 'fail' || questionnaire !== '—' ? (
                          <QuestionnaireBadge score={questionnaireScore} label={questionnaire} onClick={() => openQuestionnaireForVendor(v.vendorName.split(' ')[0])} />
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-ink-600">{v.format}</td>
                      <td className={`px-3 py-3 ${toneText[v.confidenceTone]}`}>{v.confidence}</td>
                      <td className={`px-3 py-3 ${toneText[benchmarkTone]}`}>{benchmark}</td>
                      <td className={`px-3 py-3 ${toneText[issuesTone]}`}>{issues}</td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        {v.extracted && (
                          <div className="flex items-center gap-1.5">
                            <ActionButton tone="good" onClick={() => setModal({ type: 'approve', vendor: staticVendor })}>Approve</ActionButton>
                            <ActionButton tone="warn" onClick={() => setModal({ type: 'clarify', vendor: staticVendor })}>Clarify</ActionButton>
                            <ActionButton tone="bad" onClick={() => setModal({ type: 'decline', vendor: staticVendor })}>Decline</ActionButton>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isExpanded && v.fields.length > 0 && (
                      <tr className="bg-ink-50/40">
                        <td></td>
                        <td colSpan={10} className="px-4 py-4">
                          <div className="rounded-lg bg-white border border-ink-200 p-4 animate-slide-up">
                            <div className="text-sm font-semibold text-ink-600 uppercase tracking-wide mb-3">Rate Component Breakdown</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                              {rateComponents.map((rcName) => {
                                const field = v.fields.find((f) => f.field_name === rcName);
                                return (
                                  <div key={rcName} className="px-3 py-2 bg-ink-50 rounded-lg">
                                    <div className="text-[11px] text-ink-400">{rcName}</div>
                                    <div className={`text-sm font-semibold mt-0.5 ${field?.value === 'NOT_FOUND' || !field ? 'text-bad-600' : 'text-ink-800'}`}>{field?.value || 'NOT_FOUND'}</div>
                                    {field && <div className="text-[10px] text-ink-400 mt-0.5">conf: {field.confidence.toFixed(2)}</div>}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-ink-500">
                                <span className="font-medium">Source file:</span> <span className="font-mono text-ink-700">{sourceFile}</span>
                              </div>
                              <button onClick={() => navigate(`/bids/052/vendor/${v.vendorId}`)} className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                                View Full Details <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-ink-400 mt-2 px-3">Benchmark source: Xeneta/FBX, 16 Sep 2026. Mundra–Northern Europe range ₹17,800–19,200/ton. Subject to market fluctuation.</p>

      <div className="mt-6 p-4 bg-ink-50 rounded-lg">
        <h4 className="text-sm font-semibold text-ink-600 uppercase tracking-wide mb-2">Pending & Declined</h4>
        <div className="space-y-2 text-sm">
          {pendingOrDeclined.map((v) => (
            <div className="flex justify-between" key={v.id}>
              <span className="text-ink-700">{v.name}</span>
              <span className={v.status === 'pending' ? 'text-amber-600' : 'text-ink-400'}>
                {v.status === 'pending' ? `Pending — ${v.issues}` : `Declined — ${v.issues}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ApproveModal open={modal?.type === 'approve'} onClose={() => setModal(null)} vendorName={modal?.vendor?.name || ''} />
      <ClarifyModal open={modal?.type === 'clarify'} onClose={() => setModal(null)} vendorName={modal?.vendor?.name || ''} />
      <DeclineModal open={modal?.type === 'decline'} onClose={() => setModal(null)} vendorName={modal?.vendor?.name || ''} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} context="RFP-052 · Specialty Rice → Denmark" />
      <TbcModal open={tbcOpen} onClose={() => setTbcOpen(false)} />
      <ScenarioModal open={scenarioOpen} onClose={() => setScenarioOpen(false)} />
      <QuestionnaireModal open={questionnaireOpen} onClose={() => setQuestionnaireOpen(false)} filterVendor={questionnaireFilter} />
    </div>
  );
}
