
import React from 'react';
import { ViewType } from '../../../types';

interface HeaderProps {
  currentView: ViewType;
  user?: any;
}

const Header: React.FC<HeaderProps> = ({ currentView, user }) => {
  const getTitle = () => {
    switch (currentView) {
      case 'DASHBOARD': return 'DASHBOARD';
      case 'CATEGORIES': return 'CATEGORIES';
      case 'PRODUCTS': return 'INVENTORY';
      case 'TRANSACTIONS': return 'ORDER HISTORY';
      case 'REPORTS': return 'ANALYTICS';
      case 'VOUCHERS': return 'PROMOTION';
      case 'MEMBER_LOG': return 'MEMBERSHIP';
      default: return 'ADMIN PANEL';
    }
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold tracking-wider uppercase">
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Terminal A1</span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-600 font-extrabold">{getTitle()}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">{user?.username || 'Ngolab Express'}</p>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{user?.role || 'Administrator'}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 p-0.5 border border-blue-100 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
             <div className="w-full h-full rounded-[0.55rem] overflow-hidden bg-white">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'admin'}`} alt="Avatar" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
