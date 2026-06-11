import React from 'react';
import { ViewType } from '../../../types';
import logoNgolab from '../../../shared/assets/images/logo_ngolab.png';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onLogout: () => void;
  user?: any;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const menuItems = [
    {
      id: 'DASHBOARD' as ViewType,
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'REPORTS' as ViewType,
      label: 'Analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'CATEGORIES' as ViewType,
      label: 'Categories',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      id: 'PRODUCTS' as ViewType,
      label: 'Products',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'TRANSACTIONS' as ViewType,
      label: 'Orders Log',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col overflow-hidden border-r border-slate-800/70 bg-[#071123] shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(15,23,42,0.9),transparent_45%)]" />

      <div className="relative z-10 flex shrink-0 items-center gap-3 px-6 pb-7 pt-7">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-blue-600/20">
          <img src={logoNgolab} alt="Ngolab Logo" className="h-full w-full object-cover" />
        </div>

        <div className="min-w-0">
          <h1 className="text-[15px] font-black leading-tight tracking-tight text-white">NGOLAB</h1>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Express Admin
          </p>
        </div>
      </div>

      <div className="sidebar-scroll relative z-10 min-h-0 flex-1 overflow-y-auto px-4">
        <nav>
          <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300 ${
                    isActive
                      ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="text-[13px] font-semibold tracking-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="relative z-10 shrink-0 p-4">
        <div className="rounded-2xl border border-white/5 bg-white/3 p-4 shadow-inner">
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              </span>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">
                System Active
              </p>
            </div>

            <p className="pl-5 text-[10px] font-medium text-slate-500">
              All systems operational
            </p>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/60 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 transition-all duration-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout Session
          </button>
        </div>

        <p className="mt-4 text-center text-[9px] font-black uppercase tracking-[0.24em] text-slate-600">
          v1.0.2 Stable
        </p>
      </div>

      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          display: none;
        }

        .sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;