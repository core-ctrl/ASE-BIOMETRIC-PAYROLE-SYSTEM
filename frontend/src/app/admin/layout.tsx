"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-wider text-slate-200">ADMIN PANEL</h2>
          <p className="text-xs text-slate-400 mt-1">Biometric Payroll System</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/admin/dashboard" className="block px-4 py-3 rounded hover:bg-slate-800 transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/workers" className="block px-4 py-3 rounded hover:bg-slate-800 transition-colors">
            Workers
          </Link>
          <Link href="/admin/attendance" className="block px-4 py-3 rounded hover:bg-slate-800 transition-colors">
            Attendance
          </Link>
          <Link href="/admin/payroll" className="block px-4 py-3 rounded hover:bg-slate-800 transition-colors">
            Payroll
          </Link>
          <Link href="/admin/settings" className="block px-4 py-3 rounded hover:bg-slate-800 transition-colors">
            Settings
          </Link>
        </nav>
        <div className="p-4 mt-auto">
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="w-full px-4 py-2 text-sm text-center bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
