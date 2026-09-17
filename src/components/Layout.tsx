import { type ReactNode } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto scrollbar-thin">{children}</main>
    </div>
  );
}
