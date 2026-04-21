
import React from 'react';
import { Member, CartItem, Voucher } from '../../types.ts';

interface Props {
  member: Member | null;
  cart: CartItem[];
  vouchers: Voucher[];
  onSelectVoucher: (v: Voucher) => void;
  onBack: () => void;
  onContinue: () => void;
}

const MemberBenefitsScreen: React.FC<Props> = ({ member, cart, vouchers, onSelectVoucher, onBack, onContinue }) => {
  if (!member) return null;

  return (
    <div className="w-full h-full bg-[#F8FAFC] flex flex-col overflow-hidden font-sans">
      {/* HEADER */}
      <header className="bg-white px-12 h-20 flex items-center justify-between border-b border-slate-100 sticky top-0 z-30">
        <button 
          onClick={onBack} 
          className="flex items-center gap-4 text-slate-400 hover:text-black transition-all group active:scale-90"
        >
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-200 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <span className="font-black text-[10px] tracking-widest uppercase">Kembali</span>
        </button>
        <h1 className="text-xl font-black text-black uppercase tracking-tight">Kupon Promo</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* 1. DETAILED MEMBER CARD */}
          <section className="bg-white rounded-[2.5rem] p-8 px-10 border border-slate-100 shadow-[0_15px_50px_rgba(0,0,0,0.03)] flex items-center justify-between animate-in zoom-in duration-700">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#FFF1E6] rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                   </svg>
                </div>
                <div className="flex flex-col">
                   <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${member.isAffiliate ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {member.isAffiliate ? 'AFFILIATE PARTNER' : 'PLATINUM MEMBER'}
                   </p>
                   <h3 className="text-3xl font-black text-black tracking-tight leading-none uppercase">
                      {member.name}
                   </h3>
                </div>
             </div>

             <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">SALDO POIN</p>
                <div className="flex items-baseline justify-end gap-1.5">
                   <span className="text-4xl font-black text-orange-600 tracking-tighter leading-none">
                      {member.cashbackPoints.toLocaleString()}
                   </span>
                   <span className="text-xs font-black text-orange-600 uppercase tracking-widest">PTS</span>
                </div>
             </div>
          </section>

          {/* 2. VOUCHER LIST */}
          <section className="space-y-6 pb-20">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-4">Daftar Voucher Tersedia</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {vouchers.length > 0 ? (
                vouchers.map((v) => (
                  <div 
                    key={v.id} 
                    onClick={() => onSelectVoucher(v)}
                    className="bg-white rounded-[1.5rem] border-2 border-slate-100 shadow-sm relative overflow-visible group cursor-pointer hover:border-orange-500 hover:shadow-lg transition-all active:scale-[0.99]"
                  >
                    {/* Efek Gerigi Khas Voucher */}
                    <div className="absolute left-0 top-[68%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#F8FAFC] rounded-full border-2 border-slate-100 z-10" />
                    <div className="absolute right-0 top-[68%] translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#F8FAFC] rounded-full border-2 border-slate-100 z-10" />

                    <div className="p-8 pb-10 flex items-center justify-between">
                      <div className="flex-1 pr-6">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="inline-block px-3 py-1 bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">Kupon Kiosk</span>
                           {v.type === 'PERCENT' && <span className="text-[9px] font-bold text-orange-500 uppercase">Hemat {v.discount}%</span>}
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 leading-tight mb-2 uppercase tracking-tight group-hover:text-orange-600 transition-colors">{v.title}</h4>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase">{v.description}</p>
                      </div>
                      
                      <div className="w-24 h-24 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-orange-50 transition-colors shrink-0">
                         <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Potongan</p>
                         <p className="text-xl font-black text-slate-900 group-hover:text-orange-500 transition-colors">
                            {v.type === 'PERCENT' ? `${v.discount}%` : `Rp${(v.discount/1000).toFixed(0)}rb`}
                         </p>
                      </div>
                    </div>
                    
                    <div className="relative px-6">
                      <div className="border-t-2 border-dashed border-slate-100 w-full" />
                    </div>
                    
                    <div className="p-6 px-8 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Promo Berlaku di Semua Menu</p>
                      <button className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-orange-500 transition-colors shadow-lg">
                        Gunakan Promo
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                   </div>
                   <p className="text-slate-400 font-black uppercase tracking-widest">Tidak ada voucher tersedia untuk saat ini</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <footer className="p-10 bg-white border-t border-slate-100 sticky bottom-0 z-40">
         <div className="max-w-4xl mx-auto">
            <button onClick={onContinue} className="w-full bg-slate-900 text-white py-8 rounded-[2rem] text-xl font-black shadow-xl transition active:scale-95 uppercase tracking-widest hover:bg-black">
                Lanjut Tanpa Voucher
            </button>
         </div>
      </footer>
    </div>
  );
};

export default MemberBenefitsScreen;
