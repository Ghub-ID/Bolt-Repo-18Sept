import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Send, Check, Pencil, FileText, Loader2, Save, X } from 'lucide-react';
import Modal from '@/components/Modal';
import { PrimaryButton, OutlineButton } from '@/components/ui';
import {
  useRfpCharter,
  CHARTER_LABELS,
  CHARTER_ORDER,
  TBC_DROPDOWN_OPTIONS,
  DEFAULT_CHARTER,
  type RfpCharter,
} from '@/context/RfpCharterContext';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const GREETING: ChatMessage = {
  role: 'ai',
  text: 'Hi! I am your RFP Co-pilot. I will help you draft a chartering inquiry. To get started, what commodity are you shipping, what volume, and from which port?',
};

function parseOptions(text: string): { question: string; options: string[] } | null {
  const qMatch = text.match(/QUESTION:\s*(.+)/i);
  const oMatch = text.match(/OPTIONS:\s*(.+)/i);
  if (!qMatch || !oMatch) return null;
  const options = oMatch[1].split('|').map(s => s.trim()).filter(Boolean);
  return { question: qMatch[1].trim(), options };
}

function parseRfpJson(text: string): RfpCharter | null {
  const match = text.match(/<RFP_JSON>\s*([\s\S]*?)\s*<\/RFP_JSON>/i);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed.commodity) return null;
    return {
      commodity: parsed.commodity || 'TBC',
      volume: parsed.volume || 'TBC',
      origin: parsed.origin || 'TBC',
      destination: parsed.destination || 'TBC',
      incoterms: parsed.incoterms || 'TBC',
      shipment_window: parsed.shipment_window || 'TBC',
      rate_validity: parsed.rate_validity || 'TBC',
      free_days: parsed.free_days || 'TBC',
      payment_terms: parsed.payment_terms || 'TBC',
      special_requirements: parsed.special_requirements || 'TBC',
      tbc_fields: Array.isArray(parsed.tbc_fields) ? parsed.tbc_fields : [],
    };
  } catch {
    return null;
  }
}

function stripRfpJson(text: string): string {
  return text.replace(/<RFP_JSON>[\s\S]*?<\/RFP_JSON>/gi, '').trim();
}

export default function CreateRfpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { charter, setCharter } = useRfpCharter();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [charterGenerated, setCharterGenerated] = useState(false);
  const [sent, setSent] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<RfpCharter>(DEFAULT_CHARTER);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendToCopilot = async (userText: string, history: ChatMessage[]) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rfcopilot-chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      const rawReply: string = data.reply || 'Sorry, I could not generate a response.';

      const parsedCharter = parseRfpJson(rawReply);
      if (parsedCharter) {
        setCharter(parsedCharter);
        setCharterGenerated(true);
      }

      const displayText = stripRfpJson(rawReply);
      setMessages((prev) => [...prev, { role: 'ai', text: displayText }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, I had trouble processing that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const initialAskRef = useRef<string | null>(null);

  useEffect(() => {
    const initialAsk = (location.state as { initialAsk?: string } | null)?.initialAsk;
    if (initialAsk && !initialAskRef.current) {
      initialAskRef.current = initialAsk;
      const userMsg: ChatMessage = { role: 'user', text: initialAsk };
      const newMessages = [userMsg];
      setMessages(newMessages);
      sendToCopilot(initialAsk, newMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    await sendToCopilot(text, newMessages);
  };

  const sendUserMessage = (text: string) => {
    if (loading) return;
    const userMsg: ChatMessage = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    sendToCopilot(text, newMessages);
  };

  const startEdit = () => {
    setDraft({ ...charter, tbc_fields: [...charter.tbc_fields] });
    setIsEditing(true);
  };

  const saveEdit = () => {
    const cleanedTbc = draft.tbc_fields.filter((f) => {
      const val = String(draft[f as keyof Omit<RfpCharter, 'tbc_fields'>]).toUpperCase();
      return val === 'TBC';
    });
    setCharter({ ...draft, tbc_fields: cleanedTbc });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const updateDraft = (field: keyof Omit<RfpCharter, 'tbc_fields'>, value: string | number) => {
    setDraft((prev) => {
      const isTbc = String(value).toUpperCase() === 'TBC';
      const wasTbc = prev.tbc_fields.includes(field);
      let newTbcFields = [...prev.tbc_fields];
      if (!isTbc && wasTbc) {
        newTbcFields = newTbcFields.filter((f) => f !== field);
      } else if (isTbc && !wasTbc) {
        newTbcFields = [...newTbcFields, field];
      }
      return { ...prev, [field]: value, tbc_fields: newTbcFields };
    });
  };

  const handleSentDone = () => {
    setSent(false);
    navigate('/bids');
  };

  const showCharter = charterGenerated;

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Chat header */}
      <div className="px-6 py-4 border-b border-ink-200 bg-white flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-ink-900">RFP Co-pilot</div>
          <div className="text-xs text-ink-500">AI-assisted RFP creation</div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-good-50 text-good-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-good-500" /> {showCharter ? 'Drafted' : 'Drafting'}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => {
            const parsed = msg.role === 'ai' ? parseOptions(msg.text) : null;
            const displayText = parsed ? parsed.question : msg.text;
            return (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-white border border-ink-200 text-ink-700 rounded-bl-sm shadow-card'
                  }`}
                >
                  {displayText}
                  {parsed && parsed.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {parsed.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => sendUserMessage(opt)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full border border-primary-300 text-primary-700 bg-primary-50 hover:bg-primary-100 transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-white border border-ink-200 rounded-bl-sm shadow-card">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <span className="text-xs text-bad-600 bg-bad-50 px-3 py-1.5 rounded-lg">{error}</span>
            </div>
          )}

          {/* RFP Charter artifact card */}
          {showCharter && (
            <div className="bg-white border border-ink-200 rounded-xl shadow-card overflow-hidden animate-slide-up">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-ink-50 border-b border-ink-200">
                <FileText className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">RFP Charter — Draft</span>
                <span className="ml-auto text-xs text-ink-400">Draft</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {CHARTER_ORDER.map((key) => {
                  const isTbc = isEditing ? draft.tbc_fields.includes(key) : charter.tbc_fields.includes(key);
                  const value = isEditing ? String(draft[key]) : String(charter[key]);
                  const hasDropdown = isEditing && isTbc && TBC_DROPDOWN_OPTIONS[key];

                  if (isEditing) {
                    if (hasDropdown) {
                      return (
                        <div key={key} className="py-1.5 border-b border-ink-100 last:border-0">
                          <label className="text-xs text-ink-500 font-medium block mb-1">
                            {CHARTER_LABELS[key]}
                            {isTbc && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-warn-100 text-warn-700">TBC</span>
                            )}
                          </label>
                          <select
                            value={value}
                            onChange={(e) => updateDraft(key, e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-ink-200 rounded-lg text-sm text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                          >
                            {TBC_DROPDOWN_OPTIONS[key].map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="py-1.5 border-b border-ink-100 last:border-0">
                        <label className="text-xs text-ink-500 font-medium block mb-1">{CHARTER_LABELS[key]}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateDraft(key, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-ink-200 rounded-lg text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="flex items-start justify-between gap-3 py-1.5 border-b border-ink-100 last:border-0">
                      <span className="text-xs text-ink-500 font-medium shrink-0">{CHARTER_LABELS[key]}</span>
                      <span className={`text-sm text-right flex items-center gap-1.5 ${isTbc ? 'text-warn-700' : 'text-ink-800'}`}>
                        {value}
                        {isTbc && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-warn-100 text-warn-700">TBC</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 bg-ink-50 border-t border-ink-200 flex items-center gap-3">
                {isEditing ? (
                  <>
                    <PrimaryButton onClick={saveEdit}>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </PrimaryButton>
                    <OutlineButton onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                      Cancel
                    </OutlineButton>
                  </>
                ) : (
                  <>
                    <PrimaryButton onClick={() => setSent(true)}>
                      <Check className="w-4 h-4" />
                      Approve & Send RFP
                    </PrimaryButton>
                    <OutlineButton onClick={startEdit}>
                      <Pencil className="w-4 h-4" />
                      Edit
                    </OutlineButton>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="px-6 py-4 border-t border-ink-200 bg-white">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message to the co-pilot…"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 active:scale-95 transition shadow-pop disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {/* Success modal */}
      <Modal open={sent} onClose={() => setSent(false)} title="" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-good-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-good-600" />
          </div>
          <h2 className="text-xl font-bold text-ink-900 mb-2">RFP Sent!</h2>
          <p className="text-ink-500 text-sm mb-6">FreightIQ is looking for additional vendors.</p>
          <button
            onClick={handleSentDone}
            className="px-6 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
