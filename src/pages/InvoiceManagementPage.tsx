import { useState } from 'react';
import { Plus, Share2, AlertCircle } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { PageHeader, PrimaryButton, OutlineButton } from '@/components/ui';
import Modal from '@/components/Modal';
import { invoices, type InvoiceItem } from '@/data/freightData';

const statusColor: Record<string, { dot: string; text: string }> = {
  Open: { dot: 'bg-primary-500', text: 'text-primary-600' },
  Discrepancy: { dot: 'bg-bad-500', text: 'text-bad-600' },
  'Detention Alert': { dot: 'bg-warn-500', text: 'text-warn-600' },
  'Active Dispute': { dot: 'bg-info-500', text: 'text-info-600' },
  Recovered: { dot: 'bg-good-500', text: 'text-good-600' },
};

export default function InvoiceManagementPage() {
  const [shareOpen, setShareOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [people, setPeople] = useState<string[]>(['finance@oceanlink.com']);
  const sendInvite = () => { if (email.trim()) { setPeople([...people, email.trim()]); setEmail(''); } };

  return (
    <div className="px-8 py-7">
      <PageHeader
        title="Invoice Management"
        subtitle="Track invoices, discrepancies, and detention disputes"
        actions={
          <>
            <PrimaryButton>
              <Plus className="w-4 h-4" />
              New Invoice
            </PrimaryButton>
            <OutlineButton onClick={() => setShareOpen(true)}>
              <Share2 className="w-4 h-4" />
              Share
            </OutlineButton>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium rounded-lg border border-ink-200 text-ink-400 bg-ink-50 cursor-not-allowed"
              title="Coming in Phase 2"
            >
              Ask Analyst
            </button>
          </>
        }
      />

      {/* Mock data banner */}
      <div className="mb-4 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
        Mock-up for Phase 2 · All data on this page is static for demonstration
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Open" value={14} tone="primary" icon="📄" />
        <MetricCard label="Discrepancies" value={5} tone="bad" icon="⚠" />
        <MetricCard label="Detention Alerts" value={3} tone="warn" icon="⏰" />
        <MetricCard label="Active Disputes" value={2} tone="info" icon="⚖" />
        <MetricCard label="Recovered YTD" value="₹2.4L" tone="good" icon="✓" />
      </div>

      {/* Red alert banner */}
      <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-bad-50 border border-bad-100">
        <AlertCircle className="w-5 h-5 text-bad-600 shrink-0" />
        <div className="flex-1">
          <span className="text-sm font-medium text-bad-700">5 invoices have discrepancies requiring attention</span>
          <span className="text-sm text-bad-600/80 ml-2">— total impact estimated at ₹38,400</span>
        </div>
        <button className="px-3.5 py-1.5 bg-bad-500 text-white text-sm font-semibold rounded-lg hover:bg-bad-600 transition shrink-0">
          Review All
        </button>
      </div>

      {/* Invoice list */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-ink-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-600 uppercase tracking-wide">All Invoices</h2>
          <span className="text-xs text-ink-400">{invoices.length} items</span>
        </div>
        <div className="divide-y divide-ink-100">
          {invoices.map((inv: InvoiceItem) => {
            const sc = statusColor[inv.status];
            return (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-ink-50 transition cursor-pointer">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sc.dot}`} />
                <div className="shrink-0 w-24">
                  <span className="text-sm font-bold text-primary-600">{inv.number}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-800">{inv.vendor}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{inv.route} · {inv.date}</div>
                </div>
                <div className="shrink-0">
                  <span className={`text-xs font-medium ${sc.text}`}>{inv.status}</span>
                </div>
                <div className="shrink-0 w-28 text-right text-sm font-bold text-ink-800">{inv.amount}</div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share Invoice Dashboard" subtitle="Invite team members to view">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" className="flex-1 px-3.5 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            <button onClick={sendInvite} className="px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">Send Invite</button>
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
    </div>
  );
}
