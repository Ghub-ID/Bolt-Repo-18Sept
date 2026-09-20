import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Share2, ChevronRight } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { StatusTag } from '@/components/Badge';
import { PageHeader, PrimaryButton, OutlineButton } from '@/components/ui';
import Modal from '@/components/Modal';
import { rfpList } from '@/data/freightData';
import { useVendorCount } from '@/hooks/useNormalizedVendors';
import { useRfpCharter } from '@/context/RfpCharterContext';

const isTbc = (v: string) => !v || v.toUpperCase() === 'TBC';

export default function BidsManagementPage() {
  const navigate = useNavigate();
  const counts = useVendorCount();
  const { charter } = useRfpCharter();
  const [shareOpen, setShareOpen] = useState(false);
  const [sharedPeople, setSharedPeople] = useState<string[]>(['arjun.mehta@oceanlink.com', 'sara.k@nordicfreight.dk']);
  const [email, setEmail] = useState('');

  const sendInvite = () => {
    if (email.trim()) {
      setSharedPeople([...sharedPeople, email.trim()]);
      setEmail('');
    }
  };

  // Build RFP list with dynamic bid count and charter data for RFP-052
  const displayList = rfpList.map((rfp) => {
    if (rfp.id === '052') {
      const commodity = isTbc(charter.commodity) ? rfp.commodity : charter.commodity;
      const destination = isTbc(charter.destination) ? rfp.destination : charter.destination;
      const origin = isTbc(charter.origin) ? rfp.origin : charter.origin;
      const window = isTbc(charter.shipment_window) ? rfp.date : charter.shipment_window;
      const title = `${commodity} → ${destination}`;
      const subtitle = `${origin} → ${destination} · ${charter.volume} · ${window}`;
      const bidCountStr = counts.total > 0 ? `${counts.total} received` : rfp.bidCount;
      return { ...rfp, title, subtitle, bidCount: bidCountStr };
    }
    return rfp;
  });

  return (
    <div className="px-8 py-7">
      <PageHeader
        title="Bids Management"
        subtitle="Track and manage all freight procurement RFPs"
        actions={
          <>
            <PrimaryButton onClick={() => navigate('/rfp/create')}>
              <Plus className="w-4 h-4" />
              New RFP
            </PrimaryButton>
            <OutlineButton onClick={() => setShareOpen(true)}>
              <Share2 className="w-4 h-4" />
              Share
            </OutlineButton>
          </>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Open Bids" value={1} tone="primary" icon="📋" />
        <MetricCard label="In Approval" value={1} tone="info" icon="✓" />
        <MetricCard label="Awarded YTD" value={5} tone="good" icon="🏆" />
      </div>

      {/* RFP list */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-ink-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-600 uppercase tracking-wide">All RFPs</h2>
          <span className="text-xs text-ink-400">{rfpList.length} items</span>
        </div>
        <div className="divide-y divide-ink-100">
          {displayList.map((rfp) => {
            const isClickable = rfp.id === '052';
            const rowContent = (
              <>
                <div className="shrink-0 w-20">
                  <span className="text-sm font-bold text-primary-600">{rfp.number}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-800 truncate">{rfp.title}</div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {'subtitle' in rfp && rfp.subtitle
                      ? rfp.subtitle
                      : `${rfp.commodity} · ${rfp.origin} → ${rfp.destination} · ${rfp.date}`}
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusTag status={rfp.status} />
                </div>
                <div className="shrink-0 w-44 text-right text-xs text-ink-500">
                  {rfp.bidCount && <span className="font-medium text-ink-600">{rfp.bidCount}</span>}
                  {rfp.awardedValue && <span className="font-bold text-good-600">{rfp.awardedValue}</span>}
                  {!rfp.bidCount && !rfp.awardedValue && <span className="text-ink-400">—</span>}
                </div>
                {isClickable ? (
                  <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-primary-500 transition shrink-0" />
                ) : (
                  <span className="text-xs text-ink-400 shrink-0">Mock data</span>
                )}
              </>
            );
            return isClickable ? (
              <button
                key={rfp.id}
                onClick={() => navigate(`/bids/${rfp.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-ink-50 transition group text-left"
              >
                {rowContent}
              </button>
            ) : (
              <div key={rfp.id} className="w-full flex items-center gap-4 px-5 py-4 opacity-60">
                {rowContent}
              </div>
            );
          })}
        </div>
      </div>

      {/* Share modal */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share Bids Dashboard" subtitle="Invite team members to view this dashboard">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-3.5 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button onClick={sendInvite} className="px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition">
              Send Invite
            </button>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-500 mb-2">Shared with</div>
            <div className="space-y-2">
              {sharedPeople.map((p) => (
                <div key={p} className="flex items-center justify-between px-3 py-2 bg-ink-50 rounded-lg">
                  <span className="text-sm text-ink-700">{p}</span>
                  <button
                    onClick={() => setSharedPeople(sharedPeople.filter((x) => x !== p))}
                    className="text-xs text-bad-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
