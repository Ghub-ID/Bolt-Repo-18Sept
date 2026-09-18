import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, FilePlus, Receipt, ClipboardCheck, Clock, Sparkles } from 'lucide-react';

const quickActions = [
  { label: 'Create new RFP', icon: FilePlus, path: '/rfp/create' },
  { label: 'Review open bids', icon: ClipboardCheck, path: '/bids' },
  { label: 'Check pending invoices', icon: Receipt, path: '/invoices' },
  { label: 'Recent activity', icon: Clock, path: '/recent' },
];

export default function HomePage() {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSend = () => {
    if (!input.trim()) return;
    navigate('/rfp/create', { state: { initialAsk: input.trim() } });
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-medium mb-6 animate-slide-up">
          <Sparkles className="w-3.5 h-3.5" />
          FreightIQ Co-pilot · powered by AI
        </div>

        <p className="text-sm text-ink-500 mb-1 animate-slide-up">Hi Ishita</p>
        <h1 className="text-4xl font-bold text-ink-900 tracking-tight mb-8 animate-slide-up">
          How can I help you today?
        </h1>

        {/* Input */}
        <div className="relative flex items-center mb-6 animate-slide-up">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="e.g. I need to move 5,000 MT specialty rice to Denmark…"
            className="w-full px-5 py-4 pr-14 bg-white border border-ink-200 rounded-xl text-base text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 shadow-card transition"
          />
          <button
            onClick={handleSend}
            className="absolute right-2 w-10 h-10 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 active:scale-95 transition shadow-pop disabled:opacity-40"
            disabled={!input.trim()}
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="h-12 px-5 py-3 rounded-xl bg-white border border-ink-200 text-sm font-medium text-ink-700 hover:border-primary-400 hover:shadow-card transition active:scale-95 inline-flex items-center justify-center gap-2"
              >
                <Icon className="w-4 h-4 text-primary-500" />
                {action.label}
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="mt-12 flex items-center justify-center gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-ink-900">3</div>
            <div className="text-xs text-ink-500">Open Bids</div>
          </div>
          <div className="w-px h-10 bg-ink-200" />
          <div>
            <div className="text-2xl font-bold text-ink-900">14</div>
            <div className="text-xs text-ink-500">Pending Invoices</div>
          </div>
          <div className="w-px h-10 bg-ink-200" />
          <div>
            <div className="text-2xl font-bold text-ink-900">12</div>
            <div className="text-xs text-ink-500">Awarded YTD</div>
          </div>
        </div>
      </div>
    </div>
  );
}
