import React, { useState, useMemo } from 'react';
import { CartItem, Member, Voucher, PaymentMethod } from '../../types.ts';
import logoNgolab from '../../../../shared/assets/images/logo_ngolab.png';
import ShieldIcon from '@iconify-react/pixelarticons/shield';
import LockIcon from '@iconify-react/pixelarticons/lock';
import TrashIcon from '@iconify-react/pixelarticons/trash';

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

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=600&auto=format&fit=crop';

const QRISIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h1M18 14h3M14 18h3M21 18v3M18 21h-4M21 14v1" />
  </svg>
);

const CashIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const CartScreen: React.FC<Props> = ({
  cart,
  subtotal,
  member,
  useKoin,
  onToggleKoin,
  appliedVoucher,
  onUpdateQty,
  onRemove,
  onScanMember,
  onSelectCashback,
  onBack,
  onCheckout,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.QRIS);

  const voucherDiscountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.type === 'PERCENT') {
      return subtotal * (appliedVoucher.discount / 100);
    }
    return appliedVoucher.discount;
  }, [appliedVoucher, subtotal]);

  const koinDiscountAmount = useMemo(() => {
    if (!useKoin || !member) return 0;
    const maxRedeemable = subtotal - voucherDiscountAmount;
    return Math.min(member.points, maxRedeemable);
  }, [useKoin, member, subtotal, voucherDiscountAmount]);

  const finalTotal = Math.max(0, subtotal - voucherDiscountAmount - koinDiscountAmount);

  return (
    <div className="w-full h-full min-h-screen bg-[#fbf7f2] text-slate-950 overflow-hidden">
      <header className="h-[72px] px-7 flex items-center justify-between bg-[#fbf7f2]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-orange-100 active:scale-95 transition"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-wide">Kembali</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-orange-100">
              <img src={logoNgolab} alt="Ngolab" className="w-7 h-7 object-contain" />
            </div>
            <h1 className="text-lg font-black uppercase tracking-tight">
              Ringkasan <span className="text-orange-500">Pesanan</span>
            </h1>
          </div>
        </div>

        <div className="bg-[#07111f] text-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg">
          <span className="text-xl">☝</span>
          <div>
            <p className="text-[10px] font-black uppercase">Gesture Aktif</p>
            <p className="text-[8px] text-white/60">Gunakan tangan untuk navigasi</p>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-72px)] flex overflow-hidden px-6 pb-6 gap-6">
        <section className="flex-1 overflow-y-auto no-scrollbar pr-1">
          <div className="space-y-5">
            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-orange-100">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <p className="text-sm font-black uppercase">Keranjang Kosong</p>
                  <p className="text-xs mt-1">Belum ada menu yang dipilih.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-2xl bg-[#fffaf5] border border-orange-50 p-4"
                    >
                      <img
                        src={item.image || PLACEHOLDER_IMAGE}
                        alt={item.name}
                        className="w-20 h-20 rounded-2xl object-cover bg-orange-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-black uppercase truncate">
                          {item.name}
                        </h3>

                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          Qty {item.quantity}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQty(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-white border border-slate-100 font-black active:scale-95"
                          >
                            -
                          </button>

                          <span className="w-6 text-center text-xs font-black">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => onUpdateQty(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-[#07111f] text-white font-black active:scale-95"
                          >
                            +
                          </button>
                        </div>

                        <textarea
                          placeholder="Catatan opsional&#10;Tambahkan catatan untuk pesanan"
                          className="mt-3 w-full bg-white rounded-xl px-3 py-2 text-[10px] text-slate-700 placeholder:text-slate-300 outline-none resize-none border border-orange-50 focus:border-orange-300 transition"
                          rows={2}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="text-right flex flex-col items-end justify-between self-stretch">
                        <p className="text-orange-500 text-sm font-black">
                          Rp {(item.price * item.quantity).toLocaleString()}
                        </p>

                        <button
                          onClick={() => onRemove(item.id)}
                          className="w-9 h-9 rounded-full bg-white text-slate-400 hover:text-red-500 border border-slate-100 transition"
                        >
                          <TrashIcon width="18" height="18" className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-[28px] p-6 shadow-sm border border-orange-100">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Saldo Poin
                  </p>
                  <span className="text-slate-300 text-xs">ⓘ</span>
                </div>

                <h2 className="text-3xl font-black text-orange-500">
                  {member ? member.points.toLocaleString() : '0'}
                </h2>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Gunakan poin untuk diskon
                  </p>

                  <button
                    onClick={() => member && onToggleKoin()}
                    disabled={!member || member.points === 0}
                    className={`w-12 h-7 rounded-full relative transition ${
                      useKoin ? 'bg-orange-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition shadow-sm ${
                        useKoin ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[28px] p-6 shadow-sm border border-orange-100">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">
                  Pembayaran
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedMethod(PaymentMethod.QRIS)}
                    className={`h-[92px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 relative transition ${
                      selectedMethod === PaymentMethod.QRIS
                        ? 'border-orange-500 bg-orange-50 text-orange-500'
                        : 'border-slate-100 bg-white text-slate-300'
                    }`}
                  >
                    {selectedMethod === PaymentMethod.QRIS && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">
                        ✓
                      </span>
                    )}
                    <QRISIcon />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      QRIS
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedMethod(PaymentMethod.CASH)}
                    className={`h-[92px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 relative transition ${
                      selectedMethod === PaymentMethod.CASH
                        ? 'border-orange-500 bg-orange-50 text-orange-500'
                        : 'border-slate-100 bg-white text-slate-300'
                    }`}
                  >
                    {selectedMethod === PaymentMethod.CASH && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">
                        ✓
                      </span>
                    )}
                    <CashIcon />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Kasir
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <ShieldIcon width="24" height="24" />
                </div>
                <div>
                  <p className="text-[12px] font-black uppercase text-slate-800">
                    Transaksi Aman & Terpercaya
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Semua pembayaran dienkripsi dan aman
                  </p>
                </div>
              </div>

              <div className="text-orange-400">
                <LockIcon width="30" height="30" />
              </div>
            </div>
          </div>
        </section>

        <aside className="w-[360px] bg-white rounded-[28px] shadow-sm border border-orange-100 flex flex-col overflow-hidden">
          <div className="p-7 border-b border-orange-50">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">
              Promosi
            </p>

            {member ? (
              <button
                onClick={onSelectCashback}
                className="w-full bg-orange-50 border border-orange-100 rounded-2xl p-4 text-left active:scale-[0.98] transition"
              >
                <p className="text-[12px] font-black text-slate-900 uppercase">
                  {appliedVoucher ? appliedVoucher.title : 'Punya kode promo?'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {appliedVoucher ? 'Promo terpasang' : 'Pilih voucher promo'}
                </p>
              </button>
            ) : (
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                <p className="text-[12px] font-black text-slate-900 uppercase">
                  Punya kode promo?
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Login member untuk gunakan promo
                </p>
                <button
                  onClick={onScanMember}
                  className="mt-4 w-full rounded-full border border-orange-400 text-orange-500 py-3 font-black text-[10px] uppercase tracking-widest active:scale-95 transition"
                >
                  Punya Member? Scan QR
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-7 space-y-4">
            <div className="flex justify-between text-[11px] font-black uppercase">
              <span className="text-slate-400">Subtotal</span>
              <span>Rp {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-[11px] font-black uppercase">
              <span className="text-slate-400">Diskon</span>
              <span>Rp {voucherDiscountAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-[11px] font-black uppercase">
              <span className="text-slate-400">Pajak (0%)</span>
              <span>Rp 0</span>
            </div>

            {koinDiscountAmount > 0 && (
              <div className="flex justify-between text-[11px] font-black uppercase text-emerald-500">
                <span>Koin</span>
                <span>- Rp {koinDiscountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-7 border-t border-orange-50">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Total Akhir
              </p>
              <h2 className="text-[2.35rem] leading-none font-black text-orange-500 mt-3">
                Rp {finalTotal.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="p-7">
            <button
              onClick={() => onCheckout(selectedMethod)}
              disabled={cart.length === 0}
              className={`w-full rounded-2xl py-5 px-6 flex items-center justify-between uppercase font-black tracking-widest transition ${
                cart.length > 0
                  ? 'bg-[#07111f] text-white shadow-xl active:scale-95'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <span>Konfirmasi Pesanan</span>
              <span>›</span>
            </button>
          </div>
        </aside>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CartScreen;