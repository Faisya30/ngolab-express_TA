import React from 'react';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const CashScreen: React.FC<Props> = ({ onComplete, onBack }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fffaf7] text-[#07111f]">
      <button
        onClick={onBack}
        className="absolute left-7 top-7 z-30 flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[#07111f] shadow-md active:scale-95 transition"
      >
        <span className="text-orange-500 text-lg leading-none">‹</span>
        Kembali
      </button>

      <div className="absolute right-7 top-7 z-30 flex items-center gap-3 rounded-2xl bg-[#07111f] px-5 py-3 text-white shadow-xl">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
          ✋
        </div>
        <div>
          <p className="text-[10px] font-black uppercase">Aktifkan Gesture</p>
          <p className="text-[8px] text-white/60">Gerakkan tangan untuk navigasi</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
      </div>

      <main className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <div className="mb-4 text-6xl">💼</div>

        <h1 className="text-[2.7rem] leading-none font-black uppercase tracking-tight">
          Lanjut ke <span className="text-orange-500">Kasir</span>
        </h1>

        <p className="mt-4 max-w-[520px] text-center text-[13px] leading-relaxed text-slate-500 font-semibold">
          Silakan ambil struk yang akan segera dicetak dan bawa ke konter kasir
          untuk menyelesaikan pembayaran Anda.
        </p>

        <div className="mt-8 w-full max-w-[670px] space-y-4">
          <div className="relative flex items-center gap-5 rounded-3xl bg-white px-6 py-5 border border-orange-100 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xl font-black">
              1
            </div>

            <div className="flex-1">
              <p className="text-[14px] font-black text-slate-900">
                Ambil struk pesanan tercetak
              </p>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">
                Struk berisi detail pesanan dan nomor antrean Anda.
              </p>
            </div>

            <div className="text-5xl">🧾</div>
          </div>

          <div className="relative flex items-center gap-5 rounded-3xl bg-white px-6 py-5 border border-emerald-100 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-black">
              2
            </div>

            <div className="flex-1">
              <p className="text-[14px] font-black text-slate-900">
                Tunggu nomor Anda dipanggil
              </p>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">
                Silakan menunggu hingga nomor antrean Anda dipanggil oleh sistem.
              </p>
            </div>

            <div className="relative text-5xl">
              🔔
              <span className="absolute -right-1 top-0 w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center font-black">
                1
              </span>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="mt-6 w-full h-[72px] rounded-3xl bg-[#082118] text-white shadow-[0_20px_45px_rgba(8,33,24,0.28)] flex items-center justify-between px-7 active:scale-[0.98] transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
                🖨️
              </div>
              <div className="text-left">
                <p className="text-[15px] font-black uppercase tracking-wide">
                  Konfirmasi & Cetak Struk
                </p>
                <p className="text-[10px] text-white/60 font-semibold">
                  Saya sudah mengambil struk
                </p>
              </div>
            </div>

            <span className="text-3xl leading-none">›</span>
          </button>

          <div className="flex items-center gap-4 pt-4">
            <div className="h-px flex-1 bg-slate-200" />

            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-800 active:scale-95 transition"
            >
              <span>↔</span>
              Ganti Metode Pembayaran
            </button>

            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CashScreen;