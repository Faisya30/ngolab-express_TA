import React, { useEffect } from 'react';
import { CartItem, Member } from '../../types.ts';
import HandIcon from '@iconify-react/pixelarticons/hand';
import ReceiptIcon from '@iconify-react/pixelarticons/receipt';
import ShieldIcon from '@iconify-react/pixelarticons/shield';
import PrinterIcon from '@iconify-react/pixelarticons/print';
import CheckIcon from '@iconify-react/pixelarticons/check';

interface Props {
  orderId: string;
  queueNumber: number | null;
  total: number;
  member: Member | null;
  items: CartItem[];
  onClose: () => void;
}

const SuccessScreen: React.FC<Props> = ({
  orderId,
  queueNumber,
  total,
  items,
  onClose,
}) => {
  const displayQueueNumber =
    typeof queueNumber === 'number' ? queueNumber : orderId;

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const timer = setTimeout(onClose, 45000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fffaf7] text-[#07111f]">
      <div className="absolute right-7 top-7 z-30 flex items-center gap-3 rounded-2xl bg-[#07111f] px-5 py-3 text-white shadow-xl">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
          <HandIcon width="18" height="18" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase">Aktifkan Gesture</p>
          <p className="text-[8px] text-white/60">
            Gerakkan tangan untuk navigasi
          </p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
      </div>

      <main className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="w-full max-w-[1180px] rounded-[34px] bg-white border border-orange-100 shadow-[0_22px_70px_rgba(15,23,42,0.12)] p-8">
          <div className="flex flex-col items-center">
            <div className="relative mb-5">
              <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center shadow-[0_14px_35px_rgba(16,185,129,0.22)]">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <CheckIcon width="34" height="34" />
                </div>
              </div>

              <span className="absolute -left-5 top-5 text-orange-300 text-xl">✦</span>
              <span className="absolute -right-5 top-8 text-orange-300 text-xl">✦</span>
            </div>

            <h1 className="text-[2.7rem] leading-none font-black uppercase tracking-tight">
              Pesanan <span className="text-orange-500">Sukses!</span>
            </h1>

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.32em] text-slate-400">
              Ambil struk Anda di bawah layar
            </p>
          </div>

          <div className="mt-7 rounded-3xl bg-orange-50 border border-orange-100 py-7 text-center shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-slate-400">
              Nomor Antrian
            </p>
            <h2 className="mt-2 text-[5.2rem] leading-none font-black tracking-tight text-[#07111f]">
              {displayQueueNumber}
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-3 rounded-3xl bg-white border border-orange-50 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center gap-4 border-r border-orange-50">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                <ReceiptIcon width="24" height="24" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Order ID
                </p>
                <p className="text-[14px] font-black text-slate-900">
                  #NGL-{orderId}
                </p>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4 border-r border-orange-50">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Total Bayar
                </p>
                <p className="text-[20px] font-black text-orange-500">
                  Rp {total.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldIcon width="24" height="24" />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-900">
                  Pembayaran
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Berhasil
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-white border border-orange-50 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                  <ReceiptIcon width="22" height="22" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black uppercase text-slate-900">
                    Menu Dibeli
                  </h3>
                  {items[0] && (
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {items[0].name}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-semibold">
                {totalItems} item
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                Tidak ada item pada pesanan ini.
              </p>
            ) : (
              <div className="space-y-3 max-h-[120px] overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Qty {item.quantity}
                      </p>
                    </div>

                    <span className="text-[12px] font-black text-slate-900 whitespace-nowrap">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full h-[72px] rounded-3xl bg-[#082118] text-white shadow-[0_20px_45px_rgba(8,33,24,0.28)] flex items-center justify-between px-7 active:scale-[0.98] transition"
            aria-label="Selesai"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
                <PrinterIcon width="24" height="24" />
              </div>
              <p className="text-[16px] font-black uppercase tracking-widest">
                Selesai
              </p>
            </div>

            <span className="text-3xl leading-none">›</span>
          </button>

          <p className="mt-4 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.35em]">
            Reset otomatis dalam 45s
          </p>
        </div>
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

export default SuccessScreen;