
import React from 'react';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const CashScreen: React.FC<Props> = ({ onComplete, onBack }) => {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-500 p-4 sm:p-6 md:p-8">
      <div
        className="w-full max-w-3xl text-center flex flex-col items-center"
        style={{ transform: 'scale(var(--kiosk-scale))', transformOrigin: 'center center' }}
      >
        <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-6 md:mb-8 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4 md:mb-5 uppercase tracking-tighter">Lanjut Ke Kasir</h2>
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-8 md:mb-10 leading-relaxed font-medium max-w-3xl">
          Silakan ambil struk yang akan segera dicetak dan bawa ke konter kasir untuk menyelesaikan pembayaran Anda.
        </p>

        <div className="space-y-4 w-full mb-10 md:mb-12">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 md:p-5 rounded-3xl text-left border border-slate-100 dark:border-slate-800 transition-colors">
             <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-xl shadow-sm dark:text-white transition-colors">1</div>
             <p className="text-base md:text-lg font-bold text-slate-700 dark:text-slate-300">Ambil struk pesanan tercetak</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 md:p-5 rounded-3xl text-left border border-slate-100 dark:border-slate-800 transition-colors">
             <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-xl shadow-sm dark:text-white transition-colors">2</div>
             <p className="text-base md:text-lg font-bold text-slate-700 dark:text-slate-300">Tunggu nomor Anda dipanggil</p>
          </div>
        </div>

        <button 
          onClick={onComplete}
          className="w-full bg-slate-800 dark:bg-amber-400 text-white dark:text-black py-4 md:py-5 rounded-[2rem] text-lg md:text-xl font-black shadow-xl transition active:scale-95 uppercase tracking-widest"
        >
          Konfirmasi & Cetak Struk
        </button>

        <button onClick={onBack} className="mt-6 text-slate-400 dark:text-slate-600 font-bold underline uppercase tracking-widest text-sm">
          Ganti Metode Pembayaran
        </button>
      </div>
    </div>
  );
};

export default CashScreen;
