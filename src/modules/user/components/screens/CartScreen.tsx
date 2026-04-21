
import React, { useState, useMemo } from 'react';
import { CartItem, Member, Voucher, PaymentMethod } from '../../types.ts';

interface Props {
  cart: CartItem[];
  subtotal: number;
  discount: number; 
  total: number;
  member: Member | null;
  useKoin: boolean;
  potentialPoints: number;
  onToggleKoin: () => void;
  onRemoveMember: () => void;
  appliedVoucher: Voucher | null;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onScanMember: () => void;
  onSelectCashback: () => void;
  onBack: () => void;
  onCheckout: (method: PaymentMethod) => void;
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop";

const MiniQRISIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h1M18 14h3M14 18h3M21 18v3M18 21h-4M21 14v1"/>
  </svg>
);

const MiniCashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
);

const CartScreen: React.FC<Props> = ({ 
  cart, subtotal, discount, total, member, useKoin, onToggleKoin, appliedVoucher,
  potentialPoints, onScanMember, onSelectCashback, onBack, onCheckout 
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.QRIS);

  const voucherDiscountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.type === 'PERCENT') return subtotal * (appliedVoucher.discount / 100);
    return appliedVoucher.discount;
  }, [appliedVoucher, subtotal]);

  const koinDiscountAmount = useMemo(() => {
    if (!useKoin || !member) return 0;
    const maxRedeemable = subtotal - voucherDiscountAmount;
    return Math.min(member.cashbackPoints, maxRedeemable);
  }, [useKoin, member, subtotal, voucherDiscountAmount]);

  const finalTotal = Math.max(0, subtotal - (voucherDiscountAmount + koinDiscountAmount));

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      <header className="px-8 h-14 bg-white flex items-center justify-between border-b border-slate-100 z-30 shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100 active:scale-95">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 className="text-base font-black text-black tracking-tight uppercase">Ringkasan Pesanan</h2>
        </div>

        {!member ? (
           <div className="flex items-center gap-3">
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full">+{potentialPoints.toLocaleString()} PTS</span>
              <button onClick={onScanMember} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md">Login Member</button>
           </div>
        ) : (
           <div className="flex items-center gap-3">
              <div className="text-right">
                 <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">VIP Member</p>
                 <p className="text-[11px] font-black text-black uppercase">{member.name}</p>
              </div>
              <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">M</div>
           </div>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-2xl mx-auto space-y-5">
            
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="divide-y divide-slate-50">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                          <img 
                            src={item.image || PLACEHOLDER_IMAGE} 
                            className="w-full h-full object-cover" 
                            alt={item.name} 
                            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                          />
                       </div>
                       <div className="flex-1">
                          <h4 className="text-[12px] font-black text-black uppercase tracking-tight">{item.name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Qty {item.quantity}</p>
                       </div>
                       <span className="text-sm font-black text-black tracking-tight">Rp {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
               </div>
            </section>

            <section className="grid grid-cols-2 gap-5">
               <div className={`rounded-2xl p-5 border-2 transition-all flex flex-col justify-between h-[150px] ${member ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Poin</p>
                    <h3 className="text-xl font-black">{member ? member.cashbackPoints.toLocaleString() : '0'}</h3>
                  </div>
                  <button 
                    onClick={() => member && onToggleKoin()}
                    disabled={!member || member.cashbackPoints === 0}
                    className={`w-full py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-between px-4 transition-all ${useKoin ? 'bg-emerald-500 text-white' : 'bg-white/5 border border-white/10 text-white'}`}
                  >
                    <span>{useKoin ? 'Digunakan' : 'Gunakan'}</span>
                    <div className={`w-5 h-2.5 rounded-full relative ${useKoin ? 'bg-white' : 'bg-slate-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full absolute top-0.5 transition-all ${useKoin ? 'right-0.5 bg-emerald-500' : 'left-0.5 bg-white'}`} />
                    </div>
                  </button>
               </div>

               <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between h-[150px]">
                  <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pembayaran</h3>
                  <div className="grid grid-cols-2 gap-3 flex-1 mt-3">
                     <button 
                        onClick={() => setSelectedMethod(PaymentMethod.QRIS)} 
                        className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${selectedMethod === PaymentMethod.QRIS ? 'border-orange-500 bg-orange-50/20 text-orange-600' : 'border-slate-50 text-slate-300'}`}
                     >
                        <MiniQRISIcon />
                        <span className="text-[9px] font-black uppercase tracking-wider">QRIS</span>
                     </button>
                     <button 
                        onClick={() => setSelectedMethod(PaymentMethod.CASH)} 
                        className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${selectedMethod === PaymentMethod.CASH ? 'border-orange-500 bg-orange-50/20 text-orange-600' : 'border-slate-50 text-slate-300'}`}
                     >
                        <MiniCashIcon />
                        <span className="text-[9px] font-black uppercase tracking-wider">KASIR</span>
                     </button>
                  </div>
               </div>
            </section>
          </div>
        </div>

        <aside className="w-[300px] md:w-[340px] bg-white border-l border-slate-100 p-8 flex flex-col shrink-0">
          <div className="flex-1 space-y-8">
            <div>
              <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Promosi</h4>
              {member ? (
                 <button 
                   onClick={onSelectCashback} 
                   className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${appliedVoucher ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}
                 >
                    <div className="text-left overflow-hidden min-w-0 pr-3">
                       <p className={`text-[11px] font-black uppercase leading-none mb-1 truncate ${appliedVoucher ? 'text-orange-600' : 'text-slate-900'}`}>
                         {appliedVoucher ? appliedVoucher.title : 'Pilih Voucher'}
                       </p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                         {appliedVoucher ? 'Promo Terpasang' : 'Klik untuk promo'}
                       </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${appliedVoucher ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                 </button>
              ) : (
                 <div onClick={onScanMember} className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center cursor-pointer">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Login Member untuk promo</p>
                 </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-3">
               <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Subtotal</span>
                  <span className="text-slate-900 text-xs">RP {subtotal.toLocaleString()}</span>
               </div>
               {voucherDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-orange-600 tracking-wider">
                     <span>Voucher</span>
                     <span className="text-xs">- RP {voucherDiscountAmount.toLocaleString()}</span>
                  </div>
               )}
               {koinDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-emerald-500 tracking-wider">
                     <span>Koin</span>
                     <span className="text-xs">- RP {koinDiscountAmount.toLocaleString()}</span>
                  </div>
               )}

               <div className="mt-8 pt-4">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Total Akhir</p>
                  <h2 className="text-3xl font-black text-slate-950 tracking-tighter">Rp {finalTotal.toLocaleString()}</h2>
               </div>
            </div>

            <button 
              onClick={() => onCheckout(selectedMethod)}
              disabled={cart.length === 0}
              className="w-full bg-slate-950 text-white py-5 rounded-2xl text-sm font-black shadow-xl active:scale-[0.98] transition-all hover:bg-black uppercase tracking-widest flex items-center justify-between px-8"
            >
               <span>Konfirmasi</span>
               <div className="w-5 h-5 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
               </div>
            </button>
          </div>
        </aside>
      </main>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default CartScreen;
