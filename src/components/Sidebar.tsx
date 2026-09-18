import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Receipt, Building2, Clock, Settings, Sparkles } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home, emoji: '💬' },
  { to: '/bids', label: 'Bids Management', icon: ClipboardList, emoji: '📋' },
  { to: '/invoices', label: 'Invoice Management', icon: Receipt, emoji: '🧾' },
  { to: '/vendors', label: 'Vendor Management', icon: Building2, emoji: '🏢' },
  { to: '/recent', label: 'Recent Activity', icon: Clock, emoji: '🕐' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-sidebar text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center shadow-pop">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-[15px] tracking-tight leading-none">FreightIQ</div>
          <div className="text-[10px] text-white/50 mt-0.5 leading-none">Procurement Co-pilot</div>
        </div>
      </div>

      {/* User profile */}
      <div className="mx-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-semibold text-sm shrink-0">
          NR
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">Neel Rao</div>
          <div className="text-[11px] text-white/50 truncate">Category Head — Freight</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative group ${
                isActive
                  ? 'bg-white/10 text-white font-medium border-l-[3px] border-primary-500 -ml-[3px] pl-[18px]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="text-base leading-none">{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-white/10">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              isActive ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Settings className="w-4.5 h-4.5" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
