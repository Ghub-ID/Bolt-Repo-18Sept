import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, ArrowLeft, TrendingUp, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useVendorData } from '@/context/VendorDataContext';

interface ChatMessage {
  role: 'user' | 'analyst';
  text: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'analyst',
  text: 'Hi Ishita, I have all 6 active bids for RFP-052 loaded. I can compare vendors, analyze risks, run scenario splits, or check questionnaire compliance. What would you like to dig into?',
};

export default function AnalystPage() {
  const navigate = useNavigate();
  const { vendors, loading: dataLoading } = useVendorData();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const vendorDataPayload = Object.values(vendors).map((v) => ({
        vendorId: v.vendorId,
        vendorName: v.vendorName,
        extracted: v.extracted,
        sourceType: v.sourceType,
        fields: v.fields.map((f) => ({
          field: f.field_name,
          value: f.value,
          confidence: f.confidence,
          source: f.source_location,
        })),
      }));

      const conversationHistory = newMessages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        text: msg.text,
      }));

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyst-chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          vendorData: vendorDataPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const reply =
        data.reply ?? 'I could not generate a response. Please try again.';

      setMessages((prev) => [...prev, { role: 'analyst', text: reply }]);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Failed to connect to the analyst.';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'analyst',
          text: `Sorry, I ran into an issue: ${errMsg}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const vendorList = Object.values(vendors);
  const hasNoVendorData = vendorList.length === 0 || vendorList.every((v) => !v.extracted);

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-ink-200 bg-white flex items-center gap-3">
        <button onClick={() => navigate(`/bids/052`)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-ink-900">FreightIQ Analyst</div>
          <div className="text-xs text-ink-500">RFP-052 · Specialty Rice → Denmark</div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-good-50 text-good-700 text-xs font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-warn-500 animate-pulse' : 'bg-good-500 animate-pulse'}`} />
          {loading ? 'Thinking…' : 'Online'}
        </span>
      </div>

      {hasNoVendorData && !dataLoading && (
        <div className="px-6 py-2.5 bg-warn-50 border-b border-warn-100">
          <p className="text-xs text-warn-700 text-center">Vendor data is loading. Questions may return incomplete answers until extraction completes.</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'analyst' ? 'bg-primary-500' : 'bg-ink-300'}`}>
                      {msg.role === 'analyst' ? <Sparkles className="w-4.5 h-4.5 text-white" /> : <span className="text-xs font-semibold text-white">IS</span>}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary-500 text-white rounded-tr-sm' : 'bg-white border border-ink-200 text-ink-700 rounded-tl-sm shadow-card'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-start animate-slide-up">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary-500">
                      <Sparkles className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-white border border-ink-200 shadow-card">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="px-6 py-2 bg-bad-50 border-t border-bad-100">
              <p className="text-xs text-bad-600 text-center">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="px-6 py-4 border-t border-ink-200 bg-white">
            <div className="max-w-2xl mx-auto flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder="Ask about vendor comparisons, risks, recommendations…"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 active:scale-95 transition shadow-pop disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 shrink-0 border-l border-ink-200 bg-white overflow-y-auto scrollbar-thin p-4 space-y-4">
          {/* RFP summary */}
          <div className="rounded-xl bg-primary-50 border border-primary-100 p-4">
            <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">RFP Summary</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">RFP</span><span className="font-semibold text-ink-800">RFP-052</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Commodity</span><span className="font-medium text-ink-800">Specialty Rice</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Volume</span><span className="font-medium text-ink-800">5,000 MT</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Route</span><span className="font-medium text-ink-800">Mundra → Denmark</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Window</span><span className="font-medium text-ink-800">Oct 5-20</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Status</span><span className="px-2 py-0.5 rounded bg-primary-200 text-primary-700 text-xs font-medium">Open</span></div>
            </div>
          </div>

          {/* Vendor bids */}
          <div>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2.5">Vendor Bids</div>
            <div className="space-y-2">
              {Object.values(vendors).filter((v) => v.extracted).map((v) => {
                const totalField = v.fields.find((f) => f.field_name === 'Total Rate/Ton');
                const transitField = v.fields.find((f) => f.field_name === 'Transit Time');
                const avgConf = v.fields.length > 0 ? v.fields.reduce((s, f) => s + f.confidence, 0) / v.fields.length : 0;
                const confTone = avgConf >= 0.8 ? 'bg-good-50 text-good-600' : avgConf >= 0.5 ? 'bg-warn-50 text-warn-600' : 'bg-bad-50 text-bad-600';
                const confLabel = avgConf >= 0.8 ? 'Low risk' : avgConf >= 0.5 ? 'Med risk' : 'High risk';
                return (
                  <div key={v.vendorId} className="rounded-lg border border-ink-200 p-3 hover:shadow-card transition cursor-pointer" onClick={() => navigate(`/bids/052/vendor/${v.vendorId}`)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-ink-800">{v.vendorName.split(' ').slice(0, 2).join(' ')}</span>
                      <span className="text-xs font-medium text-ink-600">{totalField?.value?.slice(0, 20) || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded font-medium ${confTone}`}>{confLabel}</span>
                      <span className="text-ink-400">{transitField?.value || '—'}</span>
                    </div>
                  </div>
                );
              })}
              {dataLoading && <p className="text-xs text-ink-400 text-center py-2">Loading vendor data…</p>}
            </div>
          </div>

          {/* Market benchmark */}
          <div className="rounded-xl bg-ink-50 border border-ink-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-info-600" />
              <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Market Benchmark</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Market range</span><span className="font-medium text-ink-800">₹17.8-19.2K/ton</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Lowest bid</span><span className="font-medium text-good-600">₹15,600 (SwiftSea)</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Highest bid</span><span className="font-medium text-bad-600">₹21,300 (Maersk)</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Median</span><span className="font-medium text-ink-800">₹18,100</span></div>
            </div>
          </div>

          {/* Quick insights */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-good-50 border border-good-100">
              <Check className="w-4 h-4 text-good-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-good-700">Best Value</div>
                <div className="text-xs text-good-600/90 mt-0.5">OceanLink — balanced cost, transit & compliance</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warn-50 border border-warn-100">
              <AlertTriangle className="w-4 h-4 text-warn-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-warn-700">Needs Clarification</div>
                <div className="text-xs text-warn-600/90 mt-0.5">Gulf Freight — USD conv, demurrage footnote, missing phyto</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-bad-50 border border-bad-100">
              <AlertTriangle className="w-4 h-4 text-bad-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-bad-700">High Risk</div>
                <div className="text-xs text-bad-600/90 mt-0.5">SwiftSea — OCR extraction, 7 free days, missing compliance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
