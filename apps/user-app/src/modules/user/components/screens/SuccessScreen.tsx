
import React, { useEffect } from 'react';
import { CartItem, Member } from '../../types.ts';

interface Props {
  orderId: string;
  total: number;
  member: Member | null;
  items: CartItem[];
  onClose: () => void;
}

const SuccessScreen: React.FC<Props> = ({ orderId, total, items, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 45000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 font-sans p-3 sm:p-4 md:p-6 overflow-y-auto relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[100px] rounded-full" />
      
      <div
        className="w-full max-w-[420px] bg-white rounded-[2.25rem] p-5 md:p-6 flex flex-col items-center shadow-2xl border border-slate-100 relative animate-in zoom-in duration-500"
        style={{ transform: 'scale(var(--kiosk-scale))', transformOrigin: 'center center' }}
      >
        
        <div className="mb-5 relative">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center relative border-2 border-white shadow-sm">
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">
          PESANAN <span className="text-orange-600">SUKSES!</span>
        </h2>
        <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest mb-5">
          Ambil struk Anda di bawah layar.
        </p>

        <div className="w-full bg-yellow-400 rounded-3xl py-4 md:py-5 flex flex-col items-center justify-center mb-5 shadow-lg border-b-4 border-yellow-500 relative">
          <span className="text-[9px] font-black text-slate-900/60 uppercase tracking-[0.4em] mb-1">Nomor Antrian</span>
          <h1 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter leading-none">
            {orderId}
          </h1>
        </div>

        <div className="w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 mb-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
              <span>Order ID</span>
              <span className="text-slate-900">#NGL-{orderId}</span>
            </div>
            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
              <span>Total Bayar</span>
              <span className="text-orange-600 text-base">Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Menu Dibeli</h3>
            <span className="text-[10px] text-slate-500">{items.reduce((acc, item) => acc + item.quantity, 0)} item</span>
          </div>

          {items.length === 0 ? (
            <p className="text-[10px] text-slate-400">Tidak ada item pada pesanan ini.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-900 leading-tight truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">Qty {item.quantity}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-slate-950 text-white py-3.5 rounded-2xl text-xs font-black shadow-lg active:scale-95 transition-all hover:bg-orange-600 flex items-center justify-between px-7"
        >
          <span className="uppercase tracking-[0.2em]">Selesai</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        
        <p className="mt-5 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Reset otomatis dalam 45s
        </p>
      </div>
    </div>
  );
};

export default SuccessScreen;
