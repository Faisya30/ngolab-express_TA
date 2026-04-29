
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'REPORTS' as ViewType,
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'CATEGORIES' as ViewType,
      label: 'Categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      id: 'PRODUCTS' as ViewType,
      label: 'Products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'VOUCHERS' as ViewType,
      label: 'Vouchers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      id: 'TRANSACTIONS' as ViewType,
      label: 'Orders Log',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'MEMBER_LOG' as ViewType,
      label: 'Member Points',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#0f172a] flex flex-col shrink-0 z-30 border-r border-slate-800 shadow-2xl overflow-hidden">
      <div className="p-8 flex items-center gap-3 shrink-0">
        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-300 overflow-hidden">
          <img src={logoNgolab} alt="Ngolab Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight tracking-tight">NGOLAB</h1>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] -mt-0.5">Express Admin</p>
        </div>
      </div>

      <div className="sidebar-scroll flex-1 min-h-0 px-4 py-2 overflow-y-auto">
        <nav className="space-y-1">
          <p className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1">Main Menu</p>
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                  {item.icon}
                </span>
                <span className={`font-semibold text-[13px] tracking-tight ${isActive ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-transform`}>
                  {item.label}
                </span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 mt-auto shrink-0">
        <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30">
          <div className="flex items-center gap-2.5 mb-5 ml-1">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Active</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#1e293b] hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 rounded-xl transition-all duration-300 text-[11px] font-bold uppercase tracking-wider border border-slate-700 hover:border-rose-500/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout Session
          </button>
        </div>
        <p className="mt-4 text-center text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">v1.0.2 Stable</p>
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
