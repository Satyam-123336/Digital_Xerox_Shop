'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-ink-900 mb-3 tracking-tight">
          Who are you?
        </h1>
        <p className="text-ink-500 text-lg">
          Choose your role to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">
        <Link href="/student" className="group">
          <div className="bg-white border-2 border-paper-200 rounded-2xl p-8 flex flex-col items-center gap-4 hover:border-signal hover:shadow-lg transition-all cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-paper-100 flex items-center justify-center group-hover:bg-signal/10 transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F6BF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-ink-900">Student</div>
              <div className="text-sm text-ink-500 mt-1">Place a print request</div>
            </div>
          </div>
        </Link>

        <Link href="/shop" className="group">
          <div className="bg-white border-2 border-paper-200 rounded-2xl p-8 flex flex-col items-center gap-4 hover:border-signal hover:shadow-lg transition-all cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-paper-100 flex items-center justify-center group-hover:bg-signal/10 transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F6BF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-ink-900">Shop Owner</div>
              <div className="text-sm text-ink-500 mt-1">Manage incoming orders</div>
            </div>
          </div>
        </Link>
      </div>

      <p className="text-xs text-ink-500/60 text-center">
        No login required. Orders are stored locally in your browser.
      </p>
    </div>
  );
}
