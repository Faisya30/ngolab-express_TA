
import React, { useState } from 'react';
import { Voucher } from '../../types.ts';

interface Props {
  onSelectVoucher: (v: Voucher) => void;
  onBack: () => void;
}

// Added explicit typing to ensure the 'type' property is correctly constrained to 'PERCENT' | 'FIXED'
const AVAILABLE_VOUCHERS: (Voucher & { category: string })[] = [
  { id: 'v1', title: 'Diskon 35% s/d 35RB - Selalu Lebih Murah', description: 'Nikmati diskon s/d 35RB untuk min. pemesanan 50RB', discount: 35, type: 'PERCENT', category: 'diskon' },
  { id: 'v2', title: 'Cashback 30% s/d 30RB', description: 'Min. pembelian 60RB untuk semua menu bakso', discount: 30, type: 'PERCENT', category: 'cashback' },
  { id: 'v3', title: 'Baperan - Diskon 10%', description: 'Diskon s/d 5RB min. pembelian 35RB untuk menu mie', discount: 10, type: 'PERCENT', category: 'diskon' },
  { id: 'v4', title: 'Baperan Chigo x Flip - Diskon 20%', description: 'Nikmati diskon s/d 15RB untuk min. pemesanan 100RB', discount: 20, type: 'PERCENT', category: 'diskon' },
];

const VoucherScreen: React.FC<Props> = ({ onSelectVoucher, onBack }) => {
  const [activeTab, setActiveTab] = useState('vouchers');
  const [activeFilter, setActiveFilter] = useState('semua');

  const filteredVouchers = AVAILABLE_VOUCHERS.filter(v => {
    if (activeFilter === 'semua') return true;
    return v.category === activeFilter;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] overflow-hidden font-sans">
      {/* 1. TOP HEADER (Identik dengan Gambar) */}
      <header className="bg-white px-8 h-20 flex items-center justify-between border-b border-slate-50 sticky top-0 z-40">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-slate-50 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-xl font-bold text-slate-900">Vouchers</h2>
        <button className="w-12 h-12 flex items-center justify-center">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </button>
      </header>

      {/* 2. TAB NAVIGATION (Vouchers / Voucher Pack) */}
      <div className="bg-[#F2F2F2] mx-8 mt-6 p-1.5 rounded-2xl flex relative z-10">
        <button 
          onClick={() => setActiveTab('vouchers')}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'vouchers' ? 'bg-white shadow-sm text-black' : 'text-slate-500'}`}
        >
          Vouchers
        </button>
        <button 
          onClick={() => setActiveTab('packs')}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'packs' ? 'bg-white shadow-sm text-black' : 'text-slate-500'}`}
        >
          Voucher Pack
        </button>
      </div>

      {/* 3. FILTERS (Semua, Diskon, Cashback, etc) */}
      <div className="flex gap-3 px-8 mt-8 overflow-x-auto no-scrollbar shrink-0">
        {['Semua', 'Diskon', 'Cashback', 'Delivery'].map(filter => (
           <button 
             key={filter}
             onClick={() => setActiveFilter(filter.toLowerCase())}
             className={`px-6 py-2.5 rounded-full border-2 text-sm font-bold whitespace-nowrap transition-all ${activeFilter === filter.toLowerCase() ? 'border-orange-200 bg-orange-50/50 text-orange-600' : 'border-slate-100 bg-white text-slate-400'}`}
           >
             {filter}
           </button>
        ))}
      </div>

      {/* 4. CONTENT LIST */}
      <div className="flex-1 overflow-y-auto p-8 pt-6 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Voucher Belum Bisa dipakai</h3>
          
          <div className="grid grid-cols-1 gap-5">
            {filteredVouchers.map((v) => (
              <div 
                key={v.id} 
                onClick={() => onSelectVoucher(v)}
                className="bg-white rounded-[1.2rem] border border-slate-200 relative overflow-visible group cursor-pointer shadow-sm"
              >
                {/* Side Cut-outs */}
                <div className="absolute left-0 top-[65%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-[#F8FAFC] rounded-full border-r border-slate-200" />
                <div className="absolute right-0 top-[65%] translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-[#F8FAFC] rounded-full border-l border-slate-200" />

                {/* Main Section */}
                <div className="p-6 pb-8 flex items-start justify-between">
                  <div className="flex-1 pr-6">
                    <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase">Pakai di App</p>
                    {v.category === 'delivery' && <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 mb-2">Delivery GoSend & GrabExpress</span>}
                    <h4 className="text-lg font-bold text-slate-800 leading-tight mb-2">{v.title}</h4>
                    <p className="text-xs text-slate-400 font-medium line-clamp-1">{v.description}</p>
                  </div>
                  
                  <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M12 9v6M9 12h6"/></svg>
                  </div>
                </div>

                {/* Separator */}
                <div className="relative px-5">
                  <div className="border-t border-dashed border-slate-200 w-full" />
                </div>

                {/* Footer Section */}
                <div className="p-4 px-6 flex items-center justify-between">
                  <p className="text-[10px] font-medium text-slate-400">Berlaku hingga 28 Jan 2026, 23:59</p>
                  <button className="text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors">Detail</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
         .no-scrollbar::-webkit-scrollbar { display: none; }
         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default VoucherScreen;
