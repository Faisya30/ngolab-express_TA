
import React from 'react';
import { PaymentMethod, Member } from '../../types.ts';

interface Props {
  total: number;
  member: Member | null;
  onSelect: (m: PaymentMethod) => void;
  onBack: () => void;
}

const DetailedQRISIcon = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Frame Sudut */}
    <path d="M20 35V25C20 22.2386 22.2386 20 25 20H35" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    <path d="M65 20H75C77.7614 20 80 22.2386 80 25V35" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    <path d="M80 65V75C80 77.7614 77.7614 80 75 80H65" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    <path d="M35 80H25C22.2386 80 20 77.7614 20 75V65" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    
    {/* Pola QR Center */}
    <rect x="32" y="32" width="12" height="12" rx="2" fill="currentColor"/>
    <rect x="56" y="32" width="12" height="12" rx="2" fill="currentColor"/>
    <rect x="32" y="56" width="12" height="12" rx="2" fill="currentColor"/>
    <rect x="52" y="52" width="4" height="4" fill="currentColor" opacity="0.6"/>
    <rect x="64" y="64" width="4" height="4" fill="currentColor" opacity="0.6"/>
    <rect x="52" y="64" width="4" height="4" fill="currentColor" opacity="0.6"/>
    <rect x="64" y="52" width="4" height="4" fill="currentColor" opacity="0.6"/>
    
    {/* Scan Line Animasi (Gaya Laser) */}
    <line x1="25" y1="50" x2="75" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="2 4" opacity="0.4"/>
  </svg>
);

const DetailedCashIcon = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="10" y="30" width="80" height="40" rx="8" fill="currentColor"/>
    <circle cx="50" cy="50" r="14" fill="white" fillOpacity="0.2"/>
    <path d="M42 50H58M50 42V58" stroke="white" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="20" cy="40" r="3" fill="white" fillOpacity="0.3"/>
    <circle cx="80" cy="40" r="3" fill="white" fillOpacity="0.3"/>
    <circle cx="20" cy="60" r="3" fill="white" fillOpacity="0.3"/>
    <circle cx="80" cy="60" r="3" fill="white" fillOpacity="0.3"/>
  </svg>
);

const PaymentMethodScreen: React.FC<Props> = ({ total, member, onSelect, onBack }) => {
  return (
    <div className="w-full h-full flex flex-col p-10 bg-white overflow-hidden relative">
      <button onClick={onBack} className="relative z-10 text-slate-400 font-black flex items-center gap-3 text-[10px] mb-10 uppercase tracking-widest group">
        <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        Kembali
      </button>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-black mb-6 uppercase tracking-tighter leading-none">Pilih <span className="text-orange-600">Metode Bayar</span></h2>
          <div className="inline-flex flex-col items-center bg-slate-50 px-10 py-5 rounded-3xl border border-slate-100 shadow-inner">
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2">Total Tagihan</p>
             <span className="text-4xl font-black text-black tracking-tight">Rp {total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-row gap-10 w-full">
          {/* Tombol QRIS */}
          <button 
            onClick={() => onSelect(PaymentMethod.QRIS)}
            className="flex-1 bg-white border-2 border-slate-100 rounded-[3rem] p-12 flex flex-col items-center gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(249,115,22,0.12)] hover:border-orange-500 transition-all duration-500 group active:scale-95"
          >
            <div className="w-32 h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white text-slate-400 transition-all duration-500 p-6 shadow-inner">
              <DetailedQRISIcon />
            </div>
            <div className="text-center">
               <span className="block text-3xl font-black text-black leading-none mb-2 uppercase tracking-tighter">QRIS</span>
               <span className="text-[10px] text-slate-400 block uppercase font-black tracking-[0.2em]">OVO, Dana, GoPay, ShopeePay</span>
            </div>
          </button>

          {/* Tombol Cash */}
          <button 
            onClick={() => onSelect(PaymentMethod.CASH)}
            className="flex-1 bg-white border-2 border-slate-100 rounded-[3rem] p-12 flex flex-col items-center gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(16,185,129,0.12)] hover:border-emerald-500 transition-all duration-500 group active:scale-95"
          >
            <div className="w-32 h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white text-slate-400 transition-all duration-500 p-6 shadow-inner">
              <DetailedCashIcon />
            </div>
            <div className="text-center">
               <span className="block text-3xl font-black text-black leading-none mb-2 uppercase tracking-tighter">KASIR / TUNAI</span>
               <span className="text-[10px] text-slate-400 block uppercase font-black tracking-[0.2em]">Bayar di Konter Kasir</span>
            </div>
          </button>
        </div>

        <div className="mt-20 flex items-center gap-4 text-slate-300">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
           <span className="text-xs font-black uppercase tracking-[0.3em]">Encrypted Security System</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodScreen;
