import { Building2, Settings as SettingsIcon } from 'lucide-react';

export default function ComingSoonPage({ title, icon: Icon }: { title: string; icon: typeof Building2 }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">{title}</h1>
        <p className="text-ink-500 mb-6">This section is under development. Check back soon for new features.</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink-100 text-ink-500 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-warn-500 animate-pulse" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}

export function VendorManagementPage() {
  return <ComingSoonPage title="Vendor Management" icon={Building2} />;
}

export function SettingsPage() {
  return <ComingSoonPage title="Settings" icon={SettingsIcon} />;
}
